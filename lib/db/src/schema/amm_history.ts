import { pgTable, text, serial, timestamp, integer, doublePrecision } from "drizzle-orm/pg-core";

export const ammHistoryTable = pgTable("amm_history", {
  id: serial("id").primaryKey(),
  market_id: integer("market_id").notNull(),
  up_price: doublePrecision("up_price").notNull(),
  down_price: doublePrecision("down_price").notNull(),
  up_reserve: doublePrecision("up_reserve").notNull(),
  down_reserve: doublePrecision("down_reserve").notNull(),
  prediction_count: integer("prediction_count").notNull().default(0),
  triggered_by: text("triggered_by"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export type AmmHistory = typeof ammHistoryTable.$inferSelect;
export type InsertAmmHistory = typeof ammHistoryTable.$inferInsert;
