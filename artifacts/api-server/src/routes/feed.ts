import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { predictionsTable, agentsTable, marketsTable } from "@workspace/db/schema";
import { sql, desc, gte, countDistinct, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/feed/stats", async (req, res) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const [predictions1h] = await db
      .select({ count: count() })
      .from(predictionsTable)
      .where(gte(predictionsTable.submitted_at, oneHourAgo));

    const [predictions24h] = await db
      .select({ count: count() })
      .from(predictionsTable)
      .where(gte(predictionsTable.submitted_at, twentyFourHoursAgo));

    const [activeAgents1h] = await db
      .select({ count: countDistinct(predictionsTable.agent_address) })
      .from(predictionsTable)
      .where(gte(predictionsTable.submitted_at, oneHourAgo));

    const [activeAgents24h] = await db
      .select({ count: countDistinct(predictionsTable.agent_address) })
      .from(predictionsTable)
      .where(gte(predictionsTable.submitted_at, twentyFourHoursAgo));

    const [openMarkets] = await db
      .select({ count: count() })
      .from(marketsTable)
      .where(sql`${marketsTable.status} = 'open'`);

    const [resolvedToday] = await db
      .select({ count: count() })
      .from(marketsTable)
      .where(sql`${marketsTable.status} = 'resolved' AND ${marketsTable.resolve_at} >= ${startOfDay}`);

    const [totalPredictions] = await db
      .select({ count: count() })
      .from(predictionsTable);

    const [totalAgents] = await db
      .select({ count: count() })
      .from(agentsTable);

    res.json({
      predictions_1h: predictions1h.count,
      predictions_24h: predictions24h.count,
      active_agents_1h: activeAgents1h.count,
      active_agents_24h: activeAgents24h.count,
      open_markets: openMarkets.count,
      resolved_today: resolvedToday.count,
      total_predictions_all_time: totalPredictions.count,
      total_agents_all_time: totalAgents.count,
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching feed stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/feed/live", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);

    const predictions = await db
      .select({
        id: predictionsTable.id,
        agent_address: predictionsTable.agent_address,
        agent_persona: predictionsTable.agent_persona,
        market_id: predictionsTable.market_id,
        asset: predictionsTable.asset,
        window: predictionsTable.window,
        direction: predictionsTable.direction,
        locked_multiplier: predictionsTable.locked_multiplier,
        position_in_market: predictionsTable.position_in_market,
        submitted_at: predictionsTable.submitted_at,
      })
      .from(predictionsTable)
      .orderBy(desc(predictionsTable.submitted_at))
      .limit(limit);

    const agentAddresses = [...new Set(predictions.map(p => p.agent_address))];
    const agents = agentAddresses.length > 0
      ? await db
          .select({ address: agentsTable.address, accuracy: agentsTable.accuracy })
          .from(agentsTable)
          .where(sql`${agentsTable.address} IN ${agentAddresses}`)
      : [];

    const accuracyMap = new Map(agents.map(a => [a.address, a.accuracy]));

    const items = predictions.map(p => ({
      ...p,
      agent_accuracy: accuracyMap.get(p.agent_address) ?? 0,
      submitted_at: p.submitted_at.toISOString(),
    }));

    res.json({ items });
  } catch (err) {
    req.log.error({ err }, "Error fetching live feed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
