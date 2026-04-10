import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { epochsTable, epochEarnersTable, agentsTable, marketsTable, predictionsTable } from "@workspace/db/schema";
import { eq, desc, asc, sql, count, gte } from "drizzle-orm";

const router: IRouter = Router();

router.get("/epochs/current", async (req, res) => {
  try {
    const [epoch] = await db
      .select()
      .from(epochsTable)
      .where(eq(epochsTable.status, "active"))
      .orderBy(desc(epochsTable.id))
      .limit(1);

    if (!epoch) {
      res.status(404).json({ error: "No active epoch" });
      return;
    }

    const now = new Date();
    const epochStart = new Date(epoch.date + "T00:00:00Z");
    const hoursElapsed = (now.getTime() - epochStart.getTime()) / (1000 * 60 * 60);

    const topEarners = await db
      .select()
      .from(epochEarnersTable)
      .where(eq(epochEarnersTable.epoch_id, epoch.id))
      .orderBy(desc(epochEarnersTable.total_reward))
      .limit(1);

    const topEarner = topEarners[0];

    res.json({
      id: epoch.id,
      date: epoch.date,
      hours_elapsed: Math.round(hoursElapsed * 10) / 10,
      markets_created: epoch.markets_created,
      markets_resolved: epoch.markets_resolved,
      markets_pending: epoch.markets_pending,
      total_predictions: epoch.total_predictions,
      total_agents: epoch.total_agents,
      resolved_stats: {
        global_accuracy: epoch.global_accuracy,
        top_earner_so_far: {
          address: topEarner?.address ?? "0x0000000000000000000000000000000000000000",
          estimated_reward: topEarner?.total_reward ?? 0,
        },
      },
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching current epoch");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/epochs", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = Number(req.query.offset) || 0;

    const [totalResult] = await db
      .select({ count: count() })
      .from(epochsTable);

    const epochs = await db
      .select()
      .from(epochsTable)
      .orderBy(desc(epochsTable.id))
      .limit(limit)
      .offset(offset);

    const total = totalResult.count;

    const epochIds = epochs.map(e => e.id);
    const topEarnersByEpoch = epochIds.length > 0
      ? await db
          .select()
          .from(epochEarnersTable)
          .where(sql`${epochEarnersTable.epoch_id} IN ${epochIds} AND ${epochEarnersTable.rank} = 1`)
      : [];

    const topEarnerMap = new Map(topEarnersByEpoch.map(te => [te.epoch_id, te]));

    const items = epochs.map(e => {
      const te = topEarnerMap.get(e.id);
      return {
        id: e.id,
        date: e.date,
        status: e.status,
        total_emission: e.total_emission,
        total_agents: e.total_agents,
        total_predictions: e.total_predictions,
        total_correct: e.total_correct,
        global_accuracy: e.global_accuracy,
        top_earner: {
          address: te?.address ?? "",
          earned: te?.total_reward ?? 0,
        },
        settled_at: e.settled_at?.toISOString() ?? new Date().toISOString(),
      };
    });

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
    req.log.error({ err }, "Error fetching epochs");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/epochs/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [epoch] = await db
      .select()
      .from(epochsTable)
      .where(eq(epochsTable.id, id));

    if (!epoch) {
      res.status(404).json({ error: "Epoch not found" });
      return;
    }

    const topEarners = await db
      .select()
      .from(epochEarnersTable)
      .where(eq(epochEarnersTable.epoch_id, id))
      .orderBy(asc(epochEarnersTable.rank));

    const topEarnerItems = topEarners.map(te => ({
      rank: te.rank,
      address: te.address,
      persona: te.persona,
      valid_submissions: te.valid_submissions,
      accuracy: te.accuracy,
      alpha_score: te.alpha_score,
      participation_reward: te.participation_reward,
      alpha_reward: te.alpha_reward,
      total_reward: te.total_reward,
    }));

    const personaBreakdown = await db
      .select({
        persona: epochEarnersTable.persona,
        agent_count: count(),
        accuracy: sql<number>`AVG(${epochEarnersTable.accuracy})`,
        total_earned: sql<number>`SUM(${epochEarnersTable.total_reward})`,
      })
      .from(epochEarnersTable)
      .where(eq(epochEarnersTable.epoch_id, id))
      .groupBy(epochEarnersTable.persona);

    res.json({
      id: epoch.id,
      date: epoch.date,
      status: epoch.status,
      total_emission: epoch.total_emission,
      participation_pool: epoch.participation_pool,
      alpha_pool: epoch.alpha_pool,
      markets_resolved: epoch.markets_resolved,
      total_agents: epoch.total_agents,
      total_predictions: epoch.total_predictions,
      total_correct: epoch.total_correct,
      global_accuracy: epoch.global_accuracy,
      merkle_root: epoch.merkle_root ?? null,
      settled_at: epoch.settled_at?.toISOString() ?? new Date().toISOString(),
      top_earners: topEarnerItems,
      persona_breakdown: personaBreakdown.map(pb => ({
        persona: pb.persona,
        agent_count: Number(pb.agent_count),
        accuracy: Number(pb.accuracy) || 0,
        total_earned: Number(pb.total_earned) || 0,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching epoch detail");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
