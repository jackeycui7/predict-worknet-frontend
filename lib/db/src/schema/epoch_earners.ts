import { pgTable, text, serial, integer, doublePrecision } from "drizzle-orm/pg-core";

export const epochEarnersTable = pgTable("epoch_earners", {
  id: serial("id").primaryKey(),
  epoch_id: integer("epoch_id").notNull(),
  rank: integer("rank").notNull(),
  address: text("address").notNull(),
  persona: text("persona").notNull(),
  valid_submissions: integer("valid_submissions").notNull().default(0),
  accuracy: doublePrecision("accuracy").notNull().default(0),
  alpha_score: doublePrecision("alpha_score").notNull().default(0),
  participation_reward: doublePrecision("participation_reward").notNull().default(0),
  alpha_reward: doublePrecision("alpha_reward").notNull().default(0),
  total_reward: doublePrecision("total_reward").notNull().default(0),
});

export type EpochEarner = typeof epochEarnersTable.$inferSelect;
export type InsertEpochEarner = typeof epochEarnersTable.$inferInsert;
