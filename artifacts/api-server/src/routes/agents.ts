import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { agentsTable, predictionsTable } from "@workspace/db/schema";
import { eq, desc, and, sql, gte, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/agents/:address", async (req, res) => {
  try {
    const address = req.params.address;
    const [agent] = await db
      .select()
      .from(agentsTable)
      .where(eq(agentsTable.address, address));

    if (!agent) {
      res.status(404).json({ error: "Agent not found" });
      return;
    }

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const [todayStats] = await db
      .select({
        submissions: count(),
        correct: sql<number>`COUNT(*) FILTER (WHERE ${predictionsTable.outcome} = 'correct')`,
      })
      .from(predictionsTable)
      .where(and(
        eq(predictionsTable.agent_address, address),
        gte(predictionsTable.submitted_at, startOfDay)
      ));

    const todaySubmissions = todayStats?.submissions ?? 0;
    const todayCorrect = Number(todayStats?.correct) ?? 0;

    const [todayEarned] = await db
      .select({
        earned: sql<number>`COALESCE(SUM(${predictionsTable.amm_score}), 0)`,
      })
      .from(predictionsTable)
      .where(and(
        eq(predictionsTable.agent_address, address),
        gte(predictionsTable.submitted_at, startOfDay),
        eq(predictionsTable.outcome, "correct")
      ));

    const [weekStats] = await db
      .select({
        submissions: count(),
        correct: sql<number>`COUNT(*) FILTER (WHERE ${predictionsTable.outcome} = 'correct')`,
        earned: sql<number>`COALESCE(SUM(CASE WHEN ${predictionsTable.outcome} = 'correct' THEN ${predictionsTable.amm_score} ELSE 0 END), 0)`,
      })
      .from(predictionsTable)
      .where(and(
        eq(predictionsTable.agent_address, address),
        gte(predictionsTable.submitted_at, startOfWeek)
      ));

    const weekSubmissions = weekStats?.submissions ?? 0;
    const weekCorrect = Number(weekStats?.correct) ?? 0;

    res.json({
      address: agent.address,
      persona: agent.persona,
      joined_at: agent.joined_at.toISOString(),
      stats: {
        total_submissions: agent.total_submissions,
        total_resolved: agent.total_resolved,
        correct: agent.correct,
        incorrect: agent.incorrect,
        accuracy: agent.accuracy,
        current_streak: agent.current_streak,
        best_streak: agent.best_streak,
        total_earned: agent.total_earned,
        avg_multiplier: agent.avg_multiplier,
        rank: agent.rank,
        favorite_asset: agent.favorite_asset,
        favorite_window: agent.favorite_window,
      },
      recent_performance: {
        today_submissions: todaySubmissions,
        today_correct: todayCorrect,
        today_accuracy: todaySubmissions > 0 ? (todayCorrect / todaySubmissions) * 100 : 0,
        today_earned: Number(todayEarned?.earned) || 0,
        week_accuracy: weekSubmissions > 0 ? (weekCorrect / weekSubmissions) * 100 : 0,
        week_earned: Number(weekStats?.earned) || 0,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching agent profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/agents/:address/predictions", async (req, res) => {
  try {
    const address = req.params.address;
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;
    const outcome = req.query.outcome as string | undefined;
    const asset = req.query.asset as string | undefined;

    const conditions = [eq(predictionsTable.agent_address, address)];
    if (outcome && outcome !== "ALL") {
      if (outcome === "pending") {
        conditions.push(sql`${predictionsTable.outcome} IS NULL`);
      } else {
        conditions.push(eq(predictionsTable.outcome, outcome));
      }
    }
    if (asset && asset !== "ALL") {
      conditions.push(eq(predictionsTable.asset, asset));
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    const [totalResult] = await db
      .select({ count: count() })
      .from(predictionsTable)
      .where(whereClause);

    const predictions = await db
      .select()
      .from(predictionsTable)
      .where(whereClause)
      .orderBy(desc(predictionsTable.submitted_at))
      .limit(limit)
      .offset(offset);

    const total = totalResult.count;

    const items = predictions.map(p => ({
      id: p.id,
      market_id: p.market_id,
      asset: p.asset,
      window: p.window,
      direction: p.direction,
      reasoning: p.reasoning,
      locked_multiplier: p.locked_multiplier,
      outcome: p.outcome ?? null,
      amm_score: p.amm_score ?? null,
      submitted_at: p.submitted_at.toISOString(),
      resolved_at: p.resolved_at?.toISOString() ?? null,
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
    req.log.error({ err }, "Error fetching agent predictions");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
