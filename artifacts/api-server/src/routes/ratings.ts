import { Router, type IRouter } from "express";
import { db, ratingsTable, reservationsTable, spotsTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { RateReservationBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/lots/:id/ratings", async (req, res): Promise<void> => {
  const lotId = parseInt(String(req.params.id), 10);
  if (isNaN(lotId)) {
    res.status(400).json({ error: "معرّف غير صالح" });
    return;
  }

  const ratings = await db.select().from(ratingsTable).where(eq(ratingsTable.lotId, lotId)).orderBy(desc(ratingsTable.createdAt));
  const result = await Promise.all(
    ratings.map(async (r) => {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, r.userId));
      return {
        id: r.id,
        userId: r.userId,
        lotId: r.lotId,
        reservationId: r.reservationId ?? null,
        stars: r.stars,
        comment: r.comment ?? null,
        createdAt: r.createdAt.toISOString(),
        userName: user?.name ?? "Anonymous",
      };
    }),
  );
  res.json(result);
});

router.post("/reservations/:id/rate", requireAuth, async (req, res): Promise<void> => {
  const reservationId = parseInt(String(req.params.id), 10);
  if (isNaN(reservationId)) {
    res.status(400).json({ error: "معرّف غير صالح" });
    return;
  }
  const parsed = RateReservationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.session.userId!;
  const [reservation] = await db.select().from(reservationsTable).where(eq(reservationsTable.id, reservationId));
  if (!reservation) {
    res.status(404).json({ error: "الحجز غير موجود" });
    return;
  }
  if (reservation.userId !== userId) {
    res.status(403).json({ error: "ممنوع" });
    return;
  }

  const [spot] = await db.select().from(spotsTable).where(eq(spotsTable.id, reservation.spotId));
  if (!spot) {
    res.status(400).json({ error: "بيانات غير صالحة" });
    return;
  }

  // Prevent duplicate
  const [existing] = await db
    .select()
    .from(ratingsTable)
    .where(and(eq(ratingsTable.reservationId, reservationId), eq(ratingsTable.userId, userId)));
  if (existing) {
    res.status(409).json({ error: "تم تقييم هذا الحجز سابقاً" });
    return;
  }

  const [rating] = await db
    .insert(ratingsTable)
    .values({
      userId,
      lotId: spot.lotId,
      reservationId,
      stars: parsed.data.stars,
      comment: parsed.data.comment ?? null,
    })
    .returning();

  res.status(201).json({
    id: rating.id,
    userId: rating.userId,
    lotId: rating.lotId,
    reservationId: rating.reservationId ?? null,
    stars: rating.stars,
    comment: rating.comment ?? null,
    createdAt: rating.createdAt.toISOString(),
  });
});

export default router;
