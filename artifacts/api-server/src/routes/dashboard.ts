import { Router, type IRouter } from "express";
import { db, parkingLotsTable, spotsTable, reservationsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "غير مصرح" });
    return;
  }

  const lots = await db.select().from(parkingLotsTable).where(eq(parkingLotsTable.ownerId, userId));
  const lotIds = lots.map((l) => l.id);

  let totalSpots = 0;
  let availableSpots = 0;
  let reservedSpots = 0;
  let occupiedSpots = 0;

  for (const lotId of lotIds) {
    const spots = await db.select().from(spotsTable).where(eq(spotsTable.lotId, lotId));
    totalSpots += spots.length;
    availableSpots += spots.filter((s) => s.status === "available").length;
    reservedSpots += spots.filter((s) => s.status === "reserved").length;
    occupiedSpots += spots.filter((s) => s.status === "occupied").length;
  }

  const allReservations = await db.select().from(reservationsTable);
  const totalReservations = allReservations.length;
  const activeReservations = allReservations.filter((r) => r.status === "active").length;

  res.json({
    totalSpots,
    availableSpots,
    reservedSpots,
    occupiedSpots,
    totalReservations,
    activeReservations,
    totalLots: lots.length,
  });
});

router.get("/dashboard/reservations", async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "غير مصرح" });
    return;
  }

  const reservations = await db.select().from(reservationsTable);

  const withDetails = await Promise.all(
    reservations.map(async (r) => {
      const [spot] = await db.select().from(spotsTable).where(eq(spotsTable.id, r.spotId));
      const [lot] = spot
        ? await db.select().from(parkingLotsTable).where(eq(parkingLotsTable.id, spot.lotId))
        : [null];
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

export default router;
