import { pgTable, text, serial, timestamp, integer, doublePrecision } from "drizzle-orm/pg-core";

export const epochsTable = pgTable("epochs", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  status: text("status").notNull().default("active"),
  total_emission: doublePrecision("total_emission").notNull().default(50000),
  participation_pool: doublePrecision("participation_pool").notNull().default(25000),
  alpha_pool: doublePrecision("alpha_pool").notNull().default(25000),
  markets_created: integer("markets_created").notNull().default(0),
  markets_resolved: integer("markets_resolved").notNull().default(0),
  markets_pending: integer("markets_pending").notNull().default(0),
  total_agents: integer("total_agents").notNull().default(0),
  total_predictions: integer("total_predictions").notNull().default(0),
  total_correct: integer("total_correct").notNull().default(0),
  global_accuracy: doublePrecision("global_accuracy").notNull().default(0),
  merkle_root: text("merkle_root"),
  settled_at: timestamp("settled_at", { withTimezone: true }),
});

export type Epoch = typeof epochsTable.$inferSelect;
export type InsertEpoch = typeof epochsTable.$inferInsert;
