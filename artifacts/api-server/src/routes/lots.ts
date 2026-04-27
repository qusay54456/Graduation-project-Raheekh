import { Router, type IRouter } from "express";
import { db, parkingLotsTable, spotsTable, ratingsTable } from "@workspace/db";
import { eq, and, gte, lte, like, or } from "drizzle-orm";
import { GetLotsQueryParams, CreateLotBody, UpdateLotBody } from "@workspace/api-zod";
import { requireSupervisor } from "../middlewares/auth";

const router: IRouter = Router();

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function ratingsForLot(lotId: number): Promise<{ avgRating: number; ratingCount: number }> {
  const ratings = await db.select().from(ratingsTable).where(eq(ratingsTable.lotId, lotId));
  if (ratings.length === 0) return { avgRating: 0, ratingCount: 0 };
  const total = ratings.reduce((s, r) => s + r.stars, 0);
  return { avgRating: Math.round((total / ratings.length) * 10) / 10, ratingCount: ratings.length };
}

router.get("/lots", async (req, res): Promise<void> => {
  const params = GetLotsQueryParams.safeParse(req.query);
  const userLat = params.success ? params.data.lat : null;
  const userLng = params.success ? params.data.lng : null;
  const search = params.success ? params.data.search : null;
  const maxPrice = params.success ? params.data.maxPrice : null;
  const minAvailable = params.success ? params.data.minAvailable : null;

  let allLots = await db.select().from(parkingLotsTable);

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    allLots = allLots.filter(
      (l) => l.name.toLowerCase().includes(q) || l.location.toLowerCase().includes(q),
    );
  }

  if (typeof maxPrice === "number") {
    allLots = allLots.filter((l) => l.pricePerHour <= maxPrice);
  }

  const lotsWithStats = await Promise.all(
    allLots.map(async (lot) => {
      const spots = await db.select().from(spotsTable).where(eq(spotsTable.lotId, lot.id));
      const availableSpots = spots.filter((s) => s.status === "available").length;
      const reservedSpots = spots.filter((s) => s.status === "reserved").length;
      const occupiedSpots = spots.filter((s) => s.status === "occupied").length;
      const { avgRating, ratingCount } = await ratingsForLot(lot.id);

      let distance: number | null = null;
      if (userLat != null && userLng != null) {
        distance = haversineDistance(userLat, userLng, lot.lat, lot.lng);
      }

      return {
        id: lot.id,
        ownerId: lot.ownerId,
        name: lot.name,
        location: lot.location,
        totalSpots: lot.totalSpots,
        lat: lot.lat,
        lng: lot.lng,
        pricePerHour: lot.pricePerHour,
        isActive: lot.isActive,
        createdAt: lot.createdAt.toISOString(),
        availableSpots,
        reservedSpots,
        occupiedSpots,
        distance,
        avgRating,
        ratingCount,
      };
    }),
  );

  let result = lotsWithStats;
  if (typeof minAvailable === "number") {
    result = result.filter((l) => l.availableSpots >= minAvailable);
  }

  if (userLat != null && userLng != null) {
    result.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }

  res.json(result);
});

router.post("/lots", requireSupervisor, async (req, res): Promise<void> => {
  const parsed = CreateLotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: JSON.parse(parsed.error.message).map((i: any) => `${i.path.join(".")}: ${i.message}`).join(" | ") });
    return;
  }

  const { name, location, totalSpots, lat, lng, pricePerHour } = parsed.data;
  const userId = req.session.userId!;

  const [lot] = await db
    .insert(parkingLotsTable)
    .values({ ownerId: userId, name, location, totalSpots, lat, lng, pricePerHour, isActive: true })
    .returning();

  const letters = "ABCDEFGHIJ";
  const spotsToInsert: { lotId: number; spotNumber: string; status: string }[] = [];
  let count = 0;
  for (let row = 0; row < letters.length && count < totalSpots; row++) {
    for (let col = 1; col <= 10 && count < totalSpots; col++) {
      spotsToInsert.push({ lotId: lot.id, spotNumber: `${letters[row]}${col}`, status: "available" });
      count++;
    }
  }
  if (spotsToInsert.length > 0) {
    await db.insert(spotsTable).values(spotsToInsert);
  }

  res.status(201).json({
    id: lot.id,
    ownerId: lot.ownerId,
    name: lot.name,
    location: lot.location,
    totalSpots: lot.totalSpots,
    lat: lot.lat,
    lng: lot.lng,
    pricePerHour: lot.pricePerHour,
    isActive: lot.isActive,
    createdAt: lot.createdAt.toISOString(),
  });
});

router.patch("/lots/:id", requireSupervisor, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "معرّف غير صالح" });
    return;
  }
  const parsed = UpdateLotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: JSON.parse(parsed.error.message).map((i: any) => `${i.path.join(".")}: ${i.message}`).join(" | ") });
    return;
  }

  const updates: Partial<typeof parkingLotsTable.$inferInsert> = {};
  for (const k of ["name", "location", "pricePerHour", "isActive", "lat", "lng"] as const) {
    const v = (parsed.data as any)[k];
    if (v !== null && v !== undefined) (updates as any)[k] = v;
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "لا توجد تغييرات" });
    return;
  }

  const [lot] = await db.update(parkingLotsTable).set(updates).where(eq(parkingLotsTable.id, id)).returning();
  if (!lot) {
    res.status(404).json({ error: "موقف السيارات غير موجود" });
    return;
  }

  res.json({
    id: lot.id,
    ownerId: lot.ownerId,
    name: lot.name,
    location: lot.location,
    totalSpots: lot.totalSpots,
    lat: lot.lat,
    lng: lot.lng,
    pricePerHour: lot.pricePerHour,
    isActive: lot.isActive,
    createdAt: lot.createdAt.toISOString(),
  });
});

router.get("/lots/:id", async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "معرّف غير صالح" });
    return;
  }

  const [lot] = await db.select().from(parkingLotsTable).where(eq(parkingLotsTable.id, id));
  if (!lot) {
    res.status(404).json({ error: "موقف السيارات غير موجود" });
    return;
  }

  const spots = await db.select().from(spotsTable).where(eq(spotsTable.lotId, id));
  const { avgRating, ratingCount } = await ratingsForLot(id);

  res.json({
    id: lot.id,
    ownerId: lot.ownerId,
    name: lot.name,
    location: lot.location,
    totalSpots: lot.totalSpots,
    lat: lot.lat,
    lng: lot.lng,
    pricePerHour: lot.pricePerHour,
    isActive: lot.isActive,
    createdAt: lot.createdAt.toISOString(),
    avgRating,
    ratingCount,
    spots: spots.map((s) => ({ id: s.id, lotId: s.lotId, spotNumber: s.spotNumber, status: s.status })),
  });
});

router.get("/lots/:id/spots", async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "معرّف غير صالح" });
    return;
  }

  const spots = await db.select().from(spotsTable).where(eq(spotsTable.lotId, id));
  res.json(spots.map((s) => ({ id: s.id, lotId: s.lotId, spotNumber: s.spotNumber, status: s.status })));
});

export default router;
