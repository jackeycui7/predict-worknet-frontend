import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { highlightsTable } from "@workspace/db/schema";
import { eq, desc, and, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/highlights", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = Number(req.query.offset) || 0;
    const type = req.query.type as string | undefined;

    const conditions: any[] = [];
    if (type && type !== "ALL") {
      conditions.push(eq(highlightsTable.type, type));
    }

    const whereClause = conditions.length > 0
      ? conditions.length > 1 ? and(...conditions) : conditions[0]
      : undefined;

    const [totalResult] = await db
      .select({ count: count() })
      .from(highlightsTable)
      .where(whereClause);

    const highlights = await db
      .select()
      .from(highlightsTable)
      .where(whereClause)
      .orderBy(desc(highlightsTable.timestamp))
      .limit(limit)
      .offset(offset);

    const total = totalResult.count;

    const items = highlights.map(h => ({
      id: h.id,
      type: h.type,
      title: h.title,
      description: h.description,
      agent_address: h.agent_address ?? null,
      agent_persona: h.agent_persona ?? null,
      market_id: h.market_id ?? null,
      multiplier: h.multiplier ?? null,
      streak_count: h.streak_count ?? null,
      earned: h.earned ?? null,
      accuracy: h.accuracy ?? null,
      winner: h.winner ?? null,
      loser: h.loser ?? null,
      winner_accuracy: h.winner_accuracy ?? null,
      loser_accuracy: h.loser_accuracy ?? null,
      count: h.count ?? null,
      timestamp: h.timestamp.toISOString(),
    }));

    res.json({
      items,
      pagination: {
        limit,
        offset,
        total,
        has_more: offset + limit < total,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching highlights");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
