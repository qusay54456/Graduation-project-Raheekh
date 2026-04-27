import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const parkingLotsTable = sqliteTable("parking_lots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerId: integer("owner_id").notNull().references(() => usersTable.id),
  name: text("name").notNull(),
  location: text("location").notNull(),
  totalSpots: integer("total_spots").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const insertParkingLotSchema = createInsertSchema(parkingLotsTable).omit({ id: true, createdAt: true });
export type InsertParkingLot = z.infer<typeof insertParkingLotSchema>;
export type ParkingLot = typeof parkingLotsTable.$inferSelect;
