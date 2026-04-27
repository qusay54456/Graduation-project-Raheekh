import { Router, type IRouter } from "express";
import { db, parkingLotsTable, spotsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { GetLotsQueryParams, CreateLotBody, GetLotParams, GetLotSpotsParams } from "@workspace/api-zod";

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

router.get("/lots", async (req, res): Promise<void> => {
  const params = GetLotsQueryParams.safeParse(req.query);
  const userLat = params.success ? params.data.lat : null;
  const userLng = params.success ? params.data.lng : null;

  const lots = await db.select().from(parkingLotsTable);

  const lotsWithStats = await Promise.all(
    lots.map(async (lot) => {
      const spots = await db.select().from(spotsTable).where(eq(spotsTable.lotId, lot.id));
      const availableSpots = spots.filter((s) => s.status === "available").length;
      const reservedSpots = spots.filter((s) => s.status === "reserved").length;
      const occupiedSpots = spots.filter((s) => s.status === "occupied").length;

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
        createdAt: lot.createdAt.toISOString(),
        availableSpots,
        reservedSpots,
        occupiedSpots,
        distance,
      };
    })
  );

  if (userLat != null && userLng != null) {
    lotsWithStats.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }

  res.json(lotsWithStats);
});

router.post("/lots", async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "غير مصرح" });
    return;
  }

  const parsed = CreateLotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, location, totalSpots, lat, lng } = parsed.data;

  const [lot] = await db
    .insert(parkingLotsTable)
    .values({ ownerId: userId, name, location, totalSpots, lat, lng })
    .returning();

  const letters = "ABCDEFGHIJ";
  const spotsToInsert = [];
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
    createdAt: lot.createdAt.toISOString(),
  });
});

router.get("/lots/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
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

  res.json({
    id: lot.id,
    ownerId: lot.ownerId,
    name: lot.name,
    location: lot.location,
    totalSpots: lot.totalSpots,
    lat: lot.lat,
    lng: lot.lng,
    createdAt: lot.createdAt.toISOString(),
    spots: spots.map((s) => ({ id: s.id, lotId: s.lotId, spotNumber: s.spotNumber, status: s.status })),
  });
});

router.get("/lots/:id/spots", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "معرّف غير صالح" });
    return;
  }

  const spots = await db.select().from(spotsTable).where(eq(spotsTable.lotId, id));
  res.json(spots.map((s) => ({ id: s.id, lotId: s.lotId, spotNumber: s.spotNumber, status: s.status })));
});

export default router;
