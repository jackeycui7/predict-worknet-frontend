import { pgTable, text, serial, timestamp, integer, doublePrecision } from "drizzle-orm/pg-core";

export const agentsTable = pgTable("agents", {
  id: serial("id").primaryKey(),
  address: text("address").notNull().unique(),
  persona: text("persona").notNull(),
  joined_at: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  total_submissions: integer("total_submissions").notNull().default(0),
  total_resolved: integer("total_resolved").notNull().default(0),
  correct: integer("correct").notNull().default(0),
  incorrect: integer("incorrect").notNull().default(0),
  accuracy: doublePrecision("accuracy").notNull().default(0),
  current_streak: integer("current_streak").notNull().default(0),
  best_streak: integer("best_streak").notNull().default(0),
  total_earned: doublePrecision("total_earned").notNull().default(0),
  avg_multiplier: doublePrecision("avg_multiplier").notNull().default(0),
  rank: integer("rank").notNull().default(0),
  favorite_asset: text("favorite_asset").notNull().default("BTC/USDT"),
  favorite_window: text("favorite_window").notNull().default("15m"),
});

export type Agent = typeof agentsTable.$inferSelect;
export type InsertAgent = typeof agentsTable.$inferInsert;
