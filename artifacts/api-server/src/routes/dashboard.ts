import { Router, type IRouter } from "express";
import { db, parkingLotsTable, spotsTable, reservationsTable, usersTable } from "@workspace/db";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { requireSupervisor } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/dashboard/stats", requireSupervisor, async (_req, res): Promise<void> => {
  const lots = await db.select().from(parkingLotsTable);
  let totalSpots = 0, availableSpots = 0, reservedSpots = 0, occupiedSpots = 0;
  for (const lot of lots) {
    const spots = await db.select().from(spotsTable).where(eq(spotsTable.lotId, lot.id));
    totalSpots += spots.length;
    availableSpots += spots.filter((s) => s.status === "available").length;
    reservedSpots += spots.filter((s) => s.status === "reserved").length;
    occupiedSpots += spots.filter((s) => s.status === "occupied").length;
  }

  const allReservations = await db.select().from(reservationsTable);
  const totalReservations = allReservations.length;
  const activeReservations = allReservations.filter((r) => r.status === "active").length;
  const totalRevenue = allReservations
    .filter((r) => r.status !== "cancelled")
    .reduce((s, r) => s + (r.totalPrice ?? 0), 0);

  const allUsers = await db.select().from(usersTable);

  res.json({
    totalSpots,
    availableSpots,
    reservedSpots,
    occupiedSpots,
    totalReservations,
    activeReservations,
    totalLots: lots.length,
    totalUsers: allUsers.length,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
  });
});

router.get("/dashboard/reservations", requireSupervisor, async (req, res): Promise<void> => {
  const status = req.query.status as string | undefined;
  const lotIdQ = req.query.lotId as string | undefined;
  const dateFrom = req.query.dateFrom as string | undefined;
  const dateTo = req.query.dateTo as string | undefined;

  let reservations = await db.select().from(reservationsTable).orderBy(desc(reservationsTable.createdAt));

  if (status) reservations = reservations.filter((r) => r.status === status);
  if (dateFrom) {
    const d = new Date(dateFrom);
    if (!isNaN(d.getTime())) reservations = reservations.filter((r) => r.startTime >= d);
  }
  if (dateTo) {
    const d = new Date(dateTo);
    if (!isNaN(d.getTime())) reservations = reservations.filter((r) => r.startTime <= d);
  }

  const filterLotId = lotIdQ ? parseInt(lotIdQ, 10) : null;

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
    }),
  );

  const filtered = filterLotId != null ? withDetails.filter((r) => r.lotId === filterLotId) : withDetails;
  res.json(filtered);
});

router.get("/dashboard/reservations/export", requireSupervisor, async (_req, res): Promise<void> => {
  const reservations = await db.select().from(reservationsTable).orderBy(desc(reservationsTable.createdAt));
  const rows = await Promise.all(
    reservations.map(async (r) => {
      const [spot] = await db.select().from(spotsTable).where(eq(spotsTable.id, r.spotId));
      const [lot] = spot ? await db.select().from(parkingLotsTable).where(eq(parkingLotsTable.id, spot.lotId)) : [null];
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, r.userId));
      return {
        id: r.id,
        userName: user?.name ?? "",
        userEmail: user?.email ?? "",
        userPhone: user?.phone ?? "",
        lotName: lot?.name ?? "",
        spotNumber: spot?.spotNumber ?? "",
        startTime: r.startTime.toISOString(),
        endTime: r.endTime.toISOString(),
        status: r.status,
        totalPrice: r.totalPrice,
        createdAt: r.createdAt.toISOString(),
      };
    }),
  );

  const headers = ["id", "userName", "userEmail", "userPhone", "lotName", "spotNumber", "startTime", "endTime", "status", "totalPrice", "createdAt"];
  const escape = (v: any) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes("\"") || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape((r as any)[h])).join(","))].join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="parknow-bookings-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send("\ufeff" + csv);
});

router.get("/dashboard/revenue", requireSupervisor, async (req, res): Promise<void> => {
  const period = (req.query.period as string) || "daily";
  const reservations = await db.select().from(reservationsTable);

  const buckets = new Map<string, { revenue: number; bookings: number }>();
  for (const r of reservations) {
    if (r.status === "cancelled") continue;
    let key: string;
    const d = r.createdAt;
    if (period === "monthly") {
      key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    } else if (period === "weekly") {
      const onejan = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getUTCDay() + 1) / 7);
      key = `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
    } else {
      key = d.toISOString().slice(0, 10);
    }
    const cur = buckets.get(key) ?? { revenue: 0, bookings: 0 };
    cur.revenue += r.totalPrice ?? 0;
    cur.bookings += 1;
    buckets.set(key, cur);
  }

  const series = Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, revenue: Math.round(v.revenue * 100) / 100, bookings: v.bookings }));

  const total = series.reduce((s, x) => s + x.revenue, 0);

  res.json({ period, total: Math.round(total * 100) / 100, series });
});

router.get("/dashboard/popular-lots", requireSupervisor, async (_req, res): Promise<void> => {
  const reservations = await db.select().from(reservationsTable);
  const lots = await db.select().from(parkingLotsTable);

  const stats = new Map<number, { bookings: number; revenue: number }>();
  for (const r of reservations) {
    if (r.status === "cancelled") continue;
    const [spot] = await db.select().from(spotsTable).where(eq(spotsTable.id, r.spotId));
    if (!spot) continue;
    const cur = stats.get(spot.lotId) ?? { bookings: 0, revenue: 0 };
    cur.bookings += 1;
    cur.revenue += r.totalPrice ?? 0;
    stats.set(spot.lotId, cur);
  }

  const result = lots
    .map((l) => {
      const s = stats.get(l.id) ?? { bookings: 0, revenue: 0 };
      return { lotId: l.id, lotName: l.name, bookings: s.bookings, revenue: Math.round(s.revenue * 100) / 100 };
    })
    .sort((a, b) => b.bookings - a.bookings);

  res.json(result);
});

router.get("/dashboard/peak-hours", requireSupervisor, async (_req, res): Promise<void> => {
  const reservations = await db.select().from(reservationsTable);
  const counts = new Array(24).fill(0);
  for (const r of reservations) {
    if (r.status === "cancelled") continue;
    counts[r.startTime.getUTCHours()] += 1;
  }
  res.json(counts.map((bookings, hour) => ({ hour, bookings })));
});

export default router;
