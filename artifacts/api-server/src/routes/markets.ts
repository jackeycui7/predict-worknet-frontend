import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { marketsTable, predictionsTable, ammHistoryTable } from "@workspace/db/schema";
import { eq, desc, asc, sql, and, count } from "drizzle-orm";

const router: IRouter = Router();

function formatMarket(m: typeof marketsTable.$inferSelect) {
  return {
    id: m.id,
    asset: m.asset,
    window: m.window,
    question: m.question,
    market_type: m.market_type,
    status: m.status,
    open_price: m.open_price,
    resolve_price: m.resolve_price ?? null,
    outcome: m.outcome ?? null,
    open_at: m.open_at.toISOString(),
    close_at: m.close_at.toISOString(),
    resolve_at: m.resolve_at?.toISOString() ?? null,
    amm: {
      up_price: m.amm_up_price,
      down_price: m.amm_down_price,
      up_reserve: m.amm_up_reserve,
      down_reserve: m.amm_down_reserve,
    },
    stats: {
      total_predictions: m.total_predictions,
      up_count: m.up_count,
      down_count: m.down_count,
      unique_agents: m.unique_agents,
      correct_count: m.correct_count,
      incorrect_count: m.incorrect_count,
    },
  };
}

router.get("/markets/active", async (req, res) => {
  try {
    const markets = await db
      .select()
      .from(marketsTable)
      .where(eq(marketsTable.status, "open"))
      .orderBy(asc(marketsTable.close_at));

    res.json({ items: markets.map(formatMarket) });
  } catch (err) {
    req.log.error({ err }, "Error fetching active markets");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/markets/resolved", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;
    const asset = req.query.asset as string | undefined;
    const window = req.query.window as string | undefined;

    const conditions = [eq(marketsTable.status, "resolved")];
    if (asset && asset !== "ALL") {
      conditions.push(eq(marketsTable.asset, asset));
    }
    if (window && window !== "ALL") {
      conditions.push(eq(marketsTable.window, window));
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    const [totalResult] = await db
      .select({ count: count() })
      .from(marketsTable)
      .where(whereClause);

    const markets = await db
      .select()
      .from(marketsTable)
      .where(whereClause)
      .orderBy(desc(marketsTable.resolve_at))
      .limit(limit)
      .offset(offset);

    const total = totalResult.count;

    res.json({
      items: markets.map(formatMarket),
      pagination: {
        limit,
        offset,
        total,
        has_more: offset + limit < total,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching resolved markets");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/markets/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [market] = await db
      .select()
      .from(marketsTable)
      .where(eq(marketsTable.id, id));

    if (!market) {
      res.status(404).json({ error: "Market not found" });
      return;
    }

    res.json(formatMarket(market));
  } catch (err) {
    req.log.error({ err }, "Error fetching market");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/markets/:id/amm-history", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const history = await db
      .select()
      .from(ammHistoryTable)
      .where(eq(ammHistoryTable.market_id, id))
      .orderBy(asc(ammHistoryTable.timestamp));

    const items = history.map(h => ({
      up_price: h.up_price,
      down_price: h.down_price,
      up_reserve: h.up_reserve,
      down_reserve: h.down_reserve,
      prediction_count: h.prediction_count,
      triggered_by: h.triggered_by ?? null,
      timestamp: h.timestamp.toISOString(),
    }));

    res.json({ items });
  } catch (err) {
    req.log.error({ err }, "Error fetching AMM history");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/markets/:id/predictions", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;
    const outcome = req.query.outcome as string | undefined;

    const conditions = [eq(predictionsTable.market_id, id)];
    if (outcome && outcome !== "ALL") {
      if (outcome === "pending") {
        conditions.push(sql`${predictionsTable.outcome} IS NULL`);
      } else {
        conditions.push(eq(predictionsTable.outcome, outcome));
      }
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
      agent_address: p.agent_address,
      agent_persona: p.agent_persona,
      market_id: p.market_id,
      asset: p.asset,
      window: p.window,
      direction: p.direction,
      reasoning: p.reasoning,
      locked_multiplier: p.locked_multiplier,
      position_in_market: p.position_in_market,
      amm_up_price_at_submit: p.amm_up_price_at_submit,
      amm_down_price_at_submit: p.amm_down_price_at_submit,
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
    req.log.error({ err }, "Error fetching market predictions");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
