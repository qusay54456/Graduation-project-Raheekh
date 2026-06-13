import { Router, type IRouter } from "express";
import { db, reservationsTable, spotsTable, parkingLotsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateReservationBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { sendEmail } from "../lib/email";
import { broadcastNewReservation } from "./notifications";

const router: IRouter = Router();

async function getReservationWithDetails(id: number) {
  const [r] = await db.select().from(reservationsTable).where(eq(reservationsTable.id, id));
  if (!r) return null;

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
    totalPrice: r.totalPrice,
    spotNumber: spot?.spotNumber ?? "",
    lotId: lot?.id ?? 0,
    lotName: lot?.name ?? "",
    lotLocation: lot?.location ?? "",
    lotLat: lot?.lat ?? 0,
    lotLng: lot?.lng ?? 0,
    userName: user?.name ?? "",
    userEmail: user?.email ?? "",
    userPhone: user?.phone ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/reservations", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const reservations = await db
    .select()
    .from(reservationsTable)
    .where(eq(reservationsTable.userId, userId))
    .orderBy(desc(reservationsTable.createdAt));

  const withDetails = await Promise.all(reservations.map((r) => getReservationWithDetails(r.id)));
  res.json(withDetails.filter(Boolean));
});

router.post("/reservations", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateReservationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: JSON.parse(parsed.error.message).map((i: any) => `${i.path.join(".")}: ${i.message}`).join(" | ") });
    return;
  }

  const userId = req.session.userId!;
  const { spotId, startTime, endTime } = parsed.data;
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    res.status(400).json({ error: "تاريخ غير صالح" });
    return;
  }
  if (end <= start) {
    res.status(400).json({ error: "وقت النهاية يجب أن يكون بعد البداية" });
    return;
  }

  const [spot] = await db.select().from(spotsTable).where(eq(spotsTable.id, spotId));
  if (!spot) {
    res.status(404).json({ error: "المقعد غير موجود" });
    return;
  }
  if (spot.status !== "available") {
    res.status(400).json({ error: "هذا المقعد غير متاح للحجز" });
    return;
  }

  const [lot] = await db.select().from(parkingLotsTable).where(eq(parkingLotsTable.id, spot.lotId));
  if (!lot || !lot.isActive) {
    res.status(400).json({ error: "موقف السيارات غير نشط" });
    return;
  }

  const hours = (end.getTime() - start.getTime()) / 3600000;
  const totalPrice = Math.round(hours * lot.pricePerHour * 100) / 100;

  const [reservation] = await db
    .insert(reservationsTable)
    .values({ userId, spotId, startTime: start, endTime: end, status: "active", totalPrice })
    .returning();

  await db.update(spotsTable).set({ status: "reserved" }).where(eq(spotsTable.id, spotId));

  const details = await getReservationWithDetails(reservation.id);

  // Fire-and-forget notifications
  if (details) {
    broadcastNewReservation(details);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (user) {
      sendEmail({
        to: user.email,
        subject: "ParkNow - تأكيد الحجز",
        text: `تم تأكيد حجزك\n\nالموقف: ${details.lotName}\nرقم المقعد: ${details.spotNumber}\nمن: ${details.startTime}\nإلى: ${details.endTime}\nالسعر الإجمالي: ${details.totalPrice} شيكل\n\nرقم الحجز: ${details.id}`,
      }).catch(() => {});
    }
  }

  res.status(201).json(details);
});

router.get("/reservations/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "معرّف غير صالح" });
    return;
  }

  const details = await getReservationWithDetails(id);
  if (!details) {
    res.status(404).json({ error: "الحجز غير موجود" });
    return;
  }

  // Owner or supervisor only
  const user = (req as any).user;
  if (details.userId !== user.id && (user.role !== "supervisor" && user.role !== "admin")) {
    res.status(403).json({ error: "ممنوع" });
    return;
  }

  res.json(details);
});

router.patch("/reservations/:id/cancel", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "معرّف غير صالح" });
    return;
  }

  const [reservation] = await db.select().from(reservationsTable).where(eq(reservationsTable.id, id));
  if (!reservation) {
    res.status(404).json({ error: "الحجز غير موجود" });
    return;
  }

  const user = (req as any).user;
  if (reservation.userId !== user.id && (user.role !== "supervisor" && user.role !== "admin")) {
    res.status(403).json({ error: "ممنوع" });
    return;
  }

  await db.update(reservationsTable).set({ status: "cancelled" }).where(eq(reservationsTable.id, id));
  await db.update(spotsTable).set({ status: "available" }).where(eq(spotsTable.id, reservation.spotId));

  const details = await getReservationWithDetails(id);
  res.json(details);
});

export default router;
