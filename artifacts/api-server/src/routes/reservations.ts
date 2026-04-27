import { Router, type IRouter } from "express";
import { db, reservationsTable, spotsTable, parkingLotsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateReservationBody } from "@workspace/api-zod";

const router: IRouter = Router();

async function getReservationWithDetails(id: number) {
  const [reservation] = await db.select().from(reservationsTable).where(eq(reservationsTable.id, id));
  if (!reservation) return null;

  const [spot] = await db.select().from(spotsTable).where(eq(spotsTable.id, reservation.spotId));
  const [lot] = spot ? await db.select().from(parkingLotsTable).where(eq(parkingLotsTable.id, spot.lotId)) : [null];
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, reservation.userId));

  return {
    id: reservation.id,
    userId: reservation.userId,
    spotId: reservation.spotId,
    startTime: reservation.startTime.toISOString(),
    endTime: reservation.endTime.toISOString(),
    status: reservation.status,
    spotNumber: spot?.spotNumber ?? "",
    lotName: lot?.name ?? "",
    lotLocation: lot?.location ?? "",
    lotLat: lot?.lat ?? 0,
    lotLng: lot?.lng ?? 0,
    userName: user?.name ?? "",
    createdAt: reservation.createdAt.toISOString(),
  };
}

router.get("/reservations", async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "غير مصرح" });
    return;
  }

  const reservations = await db
    .select()
    .from(reservationsTable)
    .where(eq(reservationsTable.userId, userId));

  const withDetails = await Promise.all(
    reservations.map(async (r) => {
      const [spot] = await db.select().from(spotsTable).where(eq(spotsTable.id, r.spotId));
      const [lot] = spot ? await db.select().from(parkingLotsTable).where(eq(parkingLotsTable.id, spot.lotId)) : [null];
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, r.userId));

      return {
        id: r.id,
        userId: r.userId,
        spotId: r.spotId,
        startTime: r.startTime.toISOString(),
        endTime: r.endTime.toISOString(),
        status: r.status,
        spotNumber: spot?.spotNumber ?? "",
        lotName: lot?.name ?? "",
        lotLocation: lot?.location ?? "",
        lotLat: lot?.lat ?? 0,
        lotLng: lot?.lng ?? 0,
        userName: user?.name ?? "",
        createdAt: r.createdAt.toISOString(),
      };
    })
  );

  withDetails.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(withDetails);
});

router.post("/reservations", async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "يجب تسجيل الدخول للحجز" });
    return;
  }

  const parsed = CreateReservationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { spotId, startTime, endTime } = parsed.data;

  const [spot] = await db.select().from(spotsTable).where(eq(spotsTable.id, spotId));
  if (!spot) {
    res.status(404).json({ error: "المقعد غير موجود" });
    return;
  }

  if (spot.status !== "available") {
    res.status(400).json({ error: "هذا المقعد غير متاح للحجز" });
    return;
  }

  const [reservation] = await db
    .insert(reservationsTable)
    .values({
      userId,
      spotId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status: "active",
    })
    .returning();

  await db.update(spotsTable).set({ status: "reserved" }).where(eq(spotsTable.id, spotId));

  const details = await getReservationWithDetails(reservation.id);
  res.status(201).json(details);
});

router.get("/reservations/:id", async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "غير مصرح" });
    return;
  }

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "معرّف غير صالح" });
    return;
  }

  const details = await getReservationWithDetails(id);
  if (!details) {
    res.status(404).json({ error: "الحجز غير موجود" });
    return;
  }

  res.json(details);
});

router.patch("/reservations/:id/cancel", async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "غير مصرح" });
    return;
  }

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "معرّف غير صالح" });
    return;
  }

  const [reservation] = await db.select().from(reservationsTable).where(eq(reservationsTable.id, id));
  if (!reservation) {
    res.status(404).json({ error: "الحجز غير موجود" });
    return;
  }

  await db
    .update(reservationsTable)
    .set({ status: "cancelled" })
    .where(eq(reservationsTable.id, id));

  await db
    .update(spotsTable)
    .set({ status: "available" })
    .where(eq(spotsTable.id, reservation.spotId));

  const details = await getReservationWithDetails(id);
  res.json(details);
});

export default router;
