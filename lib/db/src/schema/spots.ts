import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { parkingLotsTable } from "./parking-lots";

export const spotsTable = pgTable("spots", {
  id: serial("id").primaryKey(),
  lotId: integer("lot_id").notNull().references(() => parkingLotsTable.id),
  spotNumber: text("spot_number").notNull(),
  status: text("status").notNull().default("available"),
});

export const insertSpotSchema = createInsertSchema(spotsTable).omit({ id: true });
export type InsertSpot = z.infer<typeof insertSpotSchema>;
export type Spot = typeof spotsTable.$inferSelect;
