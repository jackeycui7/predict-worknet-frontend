import { pgTable, text, serial, timestamp, integer, doublePrecision } from "drizzle-orm/pg-core";

export const marketsTable = pgTable("markets", {
  id: serial("id").primaryKey(),
  asset: text("asset").notNull(),
  window: text("window").notNull(),
  question: text("question").notNull(),
  market_type: text("market_type").notNull().default("binary"),
  status: text("status").notNull().default("open"),
  open_price: doublePrecision("open_price").notNull(),
  resolve_price: doublePrecision("resolve_price"),
  outcome: text("outcome"),
  open_at: timestamp("open_at", { withTimezone: true }).notNull().defaultNow(),
  close_at: timestamp("close_at", { withTimezone: true }).notNull(),
  resolve_at: timestamp("resolve_at", { withTimezone: true }),
  amm_up_price: doublePrecision("amm_up_price").notNull().default(0.5),
  amm_down_price: doublePrecision("amm_down_price").notNull().default(0.5),
  amm_up_reserve: doublePrecision("amm_up_reserve").notNull().default(100),
  amm_down_reserve: doublePrecision("amm_down_reserve").notNull().default(100),
  total_predictions: integer("total_predictions").notNull().default(0),
  up_count: integer("up_count").notNull().default(0),
  down_count: integer("down_count").notNull().default(0),
  unique_agents: integer("unique_agents").notNull().default(0),
  correct_count: integer("correct_count").notNull().default(0),
  incorrect_count: integer("incorrect_count").notNull().default(0),
  epoch_id: integer("epoch_id"),
});

export type Market = typeof marketsTable.$inferSelect;
export type InsertMarket = typeof marketsTable.$inferInsert;
