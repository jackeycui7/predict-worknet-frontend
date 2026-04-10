import { pgTable, text, serial, timestamp, integer, doublePrecision } from "drizzle-orm/pg-core";

export const highlightsTable = pgTable("highlights", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  agent_address: text("agent_address"),
  agent_persona: text("agent_persona"),
  market_id: integer("market_id"),
  multiplier: doublePrecision("multiplier"),
  streak_count: integer("streak_count"),
  earned: doublePrecision("earned"),
  accuracy: doublePrecision("accuracy"),
  winner: text("winner"),
  loser: text("loser"),
  winner_accuracy: doublePrecision("winner_accuracy"),
  loser_accuracy: doublePrecision("loser_accuracy"),
  count: integer("count"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export type Highlight = typeof highlightsTable.$inferSelect;
export type InsertHighlight = typeof highlightsTable.$inferInsert;
