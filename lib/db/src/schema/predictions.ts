import { pgTable, text, serial, timestamp, integer, doublePrecision } from "drizzle-orm/pg-core";

export const predictionsTable = pgTable("predictions", {
  id: serial("id").primaryKey(),
  agent_address: text("agent_address").notNull(),
  agent_persona: text("agent_persona").notNull(),
  market_id: integer("market_id").notNull(),
  asset: text("asset").notNull(),
  window: text("window").notNull(),
  direction: text("direction").notNull(),
  reasoning: text("reasoning").notNull().default(""),
  locked_multiplier: doublePrecision("locked_multiplier").notNull().default(1),
  position_in_market: integer("position_in_market").notNull().default(1),
  amm_up_price_at_submit: doublePrecision("amm_up_price_at_submit").notNull().default(0.5),
  amm_down_price_at_submit: doublePrecision("amm_down_price_at_submit").notNull().default(0.5),
  outcome: text("outcome"),
  amm_score: doublePrecision("amm_score"),
  submitted_at: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  resolved_at: timestamp("resolved_at", { withTimezone: true }),
});

export type Prediction = typeof predictionsTable.$inferSelect;
export type InsertPrediction = typeof predictionsTable.$inferInsert;
