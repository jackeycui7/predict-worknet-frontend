import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { agentsTable, predictionsTable } from "@workspace/db/schema";
import { eq, desc, sql, and, count, avg, sum, countDistinct } from "drizzle-orm";

const router: IRouter = Router();

router.get("/leaderboard", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;
    const sort = (req.query.sort as string) || "earnings";
    const persona = req.query.persona as string | undefined;

    const conditions: any[] = [];
    if (persona && persona !== "ALL") {
      conditions.push(eq(agentsTable.persona, persona));
    }

    const whereClause = conditions.length > 0
      ? conditions.length > 1 ? and(...conditions) : conditions[0]
      : undefined;

    const [totalResult] = await db
      .select({ count: count() })
      .from(agentsTable)
      .where(whereClause);

    let orderByCol;
    switch (sort) {
      case "accuracy":
        orderByCol = desc(agentsTable.accuracy);
        break;
      case "streak":
        orderByCol = desc(agentsTable.current_streak);
        break;
      case "submissions":
        orderByCol = desc(agentsTable.total_submissions);
        break;
      default:
        orderByCol = desc(agentsTable.total_earned);
    }

    const agents = await db
      .select()
      .from(agentsTable)
      .where(whereClause)
      .orderBy(orderByCol)
      .limit(limit)
      .offset(offset);

    const total = totalResult.count;

    const items = agents.map((a, i) => ({
      rank: offset + i + 1,
      agent_address: a.address,
      persona: a.persona,
      total_submissions: a.total_submissions,
      accuracy: a.accuracy,
      total_earned: a.total_earned,
      current_streak: a.current_streak,
      best_streak: a.best_streak,
      avg_multiplier: a.avg_multiplier,
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
    req.log.error({ err }, "Error fetching leaderboard");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/leaderboard/personas", async (req, res) => {
  try {
    const results = await db
      .select({
        persona: agentsTable.persona,
        agent_count: count(),
        total_submissions: sum(agentsTable.total_submissions),
        accuracy: avg(agentsTable.accuracy),
        total_earned: sum(agentsTable.total_earned),
        avg_multiplier: avg(agentsTable.avg_multiplier),
      })
      .from(agentsTable)
      .groupBy(agentsTable.persona)
      .orderBy(desc(avg(agentsTable.accuracy)));

    const items = results.map(r => ({
      persona: r.persona,
      agent_count: Number(r.agent_count),
      total_submissions: Number(r.total_submissions) || 0,
      accuracy: Number(r.accuracy) || 0,
      total_earned: Number(r.total_earned) || 0,
      avg_earned_per_agent: Number(r.agent_count) > 0
        ? (Number(r.total_earned) || 0) / Number(r.agent_count)
        : 0,
      avg_multiplier: Number(r.avg_multiplier) || 0,
    }));

    res.json({ items });
  } catch (err) {
    req.log.error({ err }, "Error fetching persona leaderboard");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
