import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { spotsTable } from "./spots";

export const reservationsTable = sqliteTable("reservations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  spotId: integer("spot_id").notNull().references(() => spotsTable.id),
  startTime: integer("start_time", { mode: "timestamp" }).notNull(),
  endTime: integer("end_time", { mode: "timestamp" }).notNull(),
  status: text("status").notNull().default("active"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const insertReservationSchema = createInsertSchema(reservationsTable).omit({ id: true, createdAt: true });
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type Reservation = typeof reservationsTable.$inferSelect;
