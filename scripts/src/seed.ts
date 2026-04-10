import { db, pool } from "@workspace/db";
import {
  agentsTable,
  marketsTable,
  predictionsTable,
  epochsTable,
  epochEarnersTable,
  ammHistoryTable,
  highlightsTable,
} from "@workspace/db/schema";
import { sql } from "drizzle-orm";

const PERSONAS = [
  "quant_trader",
  "macro_analyst",
  "crypto_native",
  "academic_economist",
  "geopolitical_analyst",
  "tech_industry",
  "on_chain_analyst",
  "retail_sentiment",
] as const;

const ASSETS = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "DOGE/USDT"];
const WINDOWS = ["15m", "30m", "1h"];

function randomHex(len: number) {
  let result = "0x";
  for (let i = 0; i < len; i++) {
    result += Math.floor(Math.random() * 16).toString(16);
  }
  return result;
}

function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomFloat(min: number, max: number) {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function randomInt(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

const REASONINGS = [
  "Technical analysis shows a bullish divergence on the RSI with increasing volume. MACD crossover imminent.",
  "On-chain data reveals significant whale accumulation over the past 4 hours. Supply on exchanges declining.",
  "Macro conditions favor risk-on assets. DXY weakening, treasury yields declining.",
  "Sentiment analysis of social media shows extreme fear, historically a contrarian buy signal.",
  "Order book analysis shows heavy bid support at current levels with thin ask side above.",
  "Funding rates are deeply negative suggesting short squeeze potential.",
  "Network hash rate reaching ATH while difficulty adjustment approaching. Miners are accumulating.",
  "Geopolitical tensions easing in key regions, risk appetite improving across all asset classes.",
  "Cross-exchange spread analysis shows accumulation pattern consistent with institutional buying.",
  "Volatility compression on 4h chart suggests imminent breakout. Bollinger bands tightest in 30 days.",
  "Fibonacci retracement at 0.618 level providing strong support. Previous resistance now support.",
  "Correlation with traditional markets breaking down. Crypto decoupling as inflation hedge narrative strengthens.",
  "Smart money flow indicator turning positive after 2 weeks of distribution phase.",
  "Market microstructure analysis shows decreasing sell pressure and increasing passive buy flow.",
  "Seasonal pattern analysis favors upside. Historically Q2 produces strongest returns.",
];

async function seed() {
  console.log("Clearing existing data...");
  await db.delete(epochEarnersTable);
  await db.delete(ammHistoryTable);
  await db.delete(predictionsTable);
  await db.delete(highlightsTable);
  await db.delete(marketsTable);
  await db.delete(epochsTable);
  await db.delete(agentsTable);

  await db.execute(sql`ALTER SEQUENCE agents_id_seq RESTART WITH 1`);
  await db.execute(sql`ALTER SEQUENCE markets_id_seq RESTART WITH 1`);
  await db.execute(sql`ALTER SEQUENCE predictions_id_seq RESTART WITH 1`);
  await db.execute(sql`ALTER SEQUENCE epochs_id_seq RESTART WITH 1`);
  await db.execute(sql`ALTER SEQUENCE epoch_earners_id_seq RESTART WITH 1`);
  await db.execute(sql`ALTER SEQUENCE amm_history_id_seq RESTART WITH 1`);
  await db.execute(sql`ALTER SEQUENCE highlights_id_seq RESTART WITH 1`);

  console.log("Seeding agents...");
  const agents: Array<{
    address: string;
    persona: string;
    joined_at: Date;
    total_submissions: number;
    total_resolved: number;
    correct: number;
    incorrect: number;
    accuracy: number;
    current_streak: number;
    best_streak: number;
    total_earned: number;
    avg_multiplier: number;
    rank: number;
    favorite_asset: string;
    favorite_window: string;
  }> = [];

  for (let i = 0; i < 60; i++) {
    const totalSub = randomInt(10, 200);
    const resolved = randomInt(Math.floor(totalSub * 0.6), totalSub);
    const correct = randomInt(Math.floor(resolved * 0.3), Math.floor(resolved * 0.85));
    const incorrect = resolved - correct;
    const streak = randomInt(0, 15);

    agents.push({
      address: randomHex(40),
      persona: randomChoice(PERSONAS),
      joined_at: new Date(Date.now() - randomInt(1, 90) * 24 * 60 * 60 * 1000),
      total_submissions: totalSub,
      total_resolved: resolved,
      correct,
      incorrect,
      accuracy: resolved > 0 ? Math.round((correct / resolved) * 1000) / 10 : 0,
      current_streak: streak,
      best_streak: randomInt(streak, streak + 10),
      total_earned: randomFloat(100, 50000),
      avg_multiplier: randomFloat(1.2, 3.5),
      rank: i + 1,
      favorite_asset: randomChoice(ASSETS),
      favorite_window: randomChoice(WINDOWS),
    });
  }

  await db.insert(agentsTable).values(agents);
  console.log(`  Inserted ${agents.length} agents`);

  console.log("Seeding epochs...");
  const now = new Date();
  const epochData = [];

  for (let i = 0; i < 5; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (4 - i));
    const dateStr = date.toISOString().split("T")[0];
    const isActive = i === 4;

    epochData.push({
      date: dateStr,
      status: isActive ? "active" : "settled",
      total_emission: 50000,
      participation_pool: 25000,
      alpha_pool: 25000,
      markets_created: randomInt(15, 40),
      markets_resolved: isActive ? randomInt(5, 15) : randomInt(20, 35),
      markets_pending: isActive ? randomInt(5, 15) : 0,
      total_agents: randomInt(30, 55),
      total_predictions: randomInt(200, 600),
      total_correct: randomInt(100, 350),
      global_accuracy: randomFloat(45, 68),
      merkle_root: isActive ? null : randomHex(64),
      settled_at: isActive ? null : new Date(date.getTime() + 24 * 60 * 60 * 1000),
    });
  }

  const insertedEpochs = await db.insert(epochsTable).values(epochData).returning();
  console.log(`  Inserted ${insertedEpochs.length} epochs`);

  console.log("Seeding epoch earners...");
  const earnerData = [];
  for (const epoch of insertedEpochs) {
    const numEarners = Math.min(agents.length, 20);
    const shuffled = [...agents].sort(() => Math.random() - 0.5).slice(0, numEarners);
    for (let j = 0; j < shuffled.length; j++) {
      const partReward = randomFloat(200, 2000);
      const alphaReward = randomFloat(0, 3000);
      earnerData.push({
        epoch_id: epoch.id,
        rank: j + 1,
        address: shuffled[j].address,
        persona: shuffled[j].persona,
        valid_submissions: randomInt(5, 40),
        accuracy: randomFloat(40, 80),
        alpha_score: randomFloat(0, 5),
        participation_reward: partReward,
        alpha_reward: alphaReward,
        total_reward: partReward + alphaReward,
      });
    }
  }
  await db.insert(epochEarnersTable).values(earnerData);
  console.log(`  Inserted ${earnerData.length} epoch earners`);

  console.log("Seeding markets...");
  const marketData = [];
  const activeEpoch = insertedEpochs[insertedEpochs.length - 1];

  for (let i = 0; i < 30; i++) {
    const asset = randomChoice(ASSETS);
    const window = randomChoice(WINDOWS);
    const windowMinutes = window === "15m" ? 15 : window === "30m" ? 30 : 60;
    const basePrice = asset.startsWith("BTC") ? 67000 + randomFloat(-2000, 2000)
      : asset.startsWith("ETH") ? 3400 + randomFloat(-200, 200)
      : asset.startsWith("SOL") ? 145 + randomFloat(-20, 20)
      : asset.startsWith("BNB") ? 580 + randomFloat(-30, 30)
      : 0.15 + randomFloat(-0.03, 0.03);

    let status: string;
    let openAt: Date;
    let closeAt: Date;
    let resolveAt: Date | null = null;
    let resolvePrice: number | null = null;
    let outcome: string | null = null;
    const upPrice = randomFloat(0.3, 0.7);

    if (i < 8) {
      status = "open";
      openAt = new Date(now.getTime() - randomInt(1, windowMinutes - 1) * 60 * 1000);
      closeAt = new Date(openAt.getTime() + windowMinutes * 60 * 1000);
    } else if (i < 12) {
      status = "closed";
      openAt = new Date(now.getTime() - randomInt(windowMinutes, windowMinutes * 2) * 60 * 1000);
      closeAt = new Date(openAt.getTime() + windowMinutes * 60 * 1000);
    } else {
      status = "resolved";
      openAt = new Date(now.getTime() - randomInt(windowMinutes * 2, windowMinutes * 10) * 60 * 1000);
      closeAt = new Date(openAt.getTime() + windowMinutes * 60 * 1000);
      resolveAt = new Date(closeAt.getTime() + randomInt(1, 5) * 60 * 1000);
      resolvePrice = basePrice + randomFloat(-basePrice * 0.02, basePrice * 0.02);
      outcome = Math.random() > 0.5 ? "up" : "down";
    }

    const totalPreds = randomInt(5, 35);
    const upCount = randomInt(Math.floor(totalPreds * 0.3), Math.ceil(totalPreds * 0.7));
    const correctCount = status === "resolved" ? randomInt(Math.floor(totalPreds * 0.3), Math.ceil(totalPreds * 0.7)) : 0;

    marketData.push({
      asset,
      window,
      question: `Will ${asset} be higher in ${window}?`,
      market_type: "binary",
      status,
      open_price: basePrice,
      resolve_price: resolvePrice,
      outcome,
      open_at: openAt,
      close_at: closeAt,
      resolve_at: resolveAt,
      amm_up_price: upPrice,
      amm_down_price: Math.round((1 - upPrice) * 100) / 100,
      amm_up_reserve: randomFloat(50, 200),
      amm_down_reserve: randomFloat(50, 200),
      total_predictions: totalPreds,
      up_count: upCount,
      down_count: totalPreds - upCount,
      unique_agents: randomInt(3, Math.min(totalPreds, 20)),
      correct_count: correctCount,
      incorrect_count: status === "resolved" ? totalPreds - correctCount : 0,
      epoch_id: activeEpoch.id,
    });
  }

  const insertedMarkets = await db.insert(marketsTable).values(marketData).returning();
  console.log(`  Inserted ${insertedMarkets.length} markets`);

  console.log("Seeding predictions...");
  const predictionData = [];
  let predId = 0;

  for (const market of insertedMarkets) {
    const numPreds = market.total_predictions;
    const shuffledAgents = [...agents].sort(() => Math.random() - 0.5).slice(0, numPreds);

    for (let j = 0; j < shuffledAgents.length; j++) {
      const agent = shuffledAgents[j];
      const direction = j < market.up_count ? "up" : "down";
      const ammUp = randomFloat(0.3, 0.7);
      const submittedAt = new Date(
        market.open_at.getTime() + randomInt(0, Math.max(1, (market.close_at.getTime() - market.open_at.getTime()) / 1000)) * 1000
      );

      let predOutcome: string | null = null;
      let ammScore: number | null = null;
      let resolvedAt: Date | null = null;

      if (market.status === "resolved") {
        predOutcome = Math.random() > 0.5 ? "correct" : "incorrect";
        ammScore = predOutcome === "correct" ? randomFloat(1, 5) : 0;
        resolvedAt = market.resolve_at;
      }

      predictionData.push({
        agent_address: agent.address,
        agent_persona: agent.persona,
        market_id: market.id,
        asset: market.asset,
        window: market.window,
        direction,
        reasoning: randomChoice(REASONINGS),
        locked_multiplier: randomFloat(1.1, 4.0),
        position_in_market: j + 1,
        amm_up_price_at_submit: ammUp,
        amm_down_price_at_submit: Math.round((1 - ammUp) * 100) / 100,
        outcome: predOutcome,
        amm_score: ammScore,
        submitted_at: submittedAt,
        resolved_at: resolvedAt,
      });
    }
  }

  for (let i = 0; i < predictionData.length; i += 100) {
    const batch = predictionData.slice(i, i + 100);
    await db.insert(predictionsTable).values(batch);
  }
  console.log(`  Inserted ${predictionData.length} predictions`);

  console.log("Seeding AMM history...");
  const ammData = [];

  for (const market of insertedMarkets) {
    const numPoints = randomInt(5, 15);
    let currentUpPrice = 0.5;

    for (let j = 0; j < numPoints; j++) {
      const delta = randomFloat(-0.08, 0.08);
      currentUpPrice = Math.max(0.1, Math.min(0.9, currentUpPrice + delta));
      const ts = new Date(
        market.open_at.getTime() +
        (j / numPoints) * (market.close_at.getTime() - market.open_at.getTime())
      );

      ammData.push({
        market_id: market.id,
        up_price: Math.round(currentUpPrice * 1000) / 1000,
        down_price: Math.round((1 - currentUpPrice) * 1000) / 1000,
        up_reserve: randomFloat(50, 200),
        down_reserve: randomFloat(50, 200),
        prediction_count: j,
        triggered_by: j === 0 ? null : randomChoice(agents).address,
        timestamp: ts,
      });
    }
  }

  for (let i = 0; i < ammData.length; i += 100) {
    const batch = ammData.slice(i, i + 100);
    await db.insert(ammHistoryTable).values(batch);
  }
  console.log(`  Inserted ${ammData.length} AMM history points`);

  console.log("Seeding highlights...");
  const highlightData = [];

  for (let i = 0; i < 5; i++) {
    const agent = randomChoice(agents);
    const market = randomChoice(insertedMarkets);
    highlightData.push({
      type: "contrarian",
      title: `Contrarian Call by ${agent.address.slice(0, 8)}...`,
      description: `${agent.persona} went against the crowd on ${market.asset} ${market.window} and locked ${randomFloat(2, 4)}x multiplier`,
      agent_address: agent.address,
      agent_persona: agent.persona,
      market_id: market.id,
      multiplier: randomFloat(2, 4),
      timestamp: new Date(now.getTime() - randomInt(0, 48) * 60 * 60 * 1000),
    });
  }

  for (let i = 0; i < 4; i++) {
    const agent = randomChoice(agents);
    const streakCount = randomInt(7, 20);
    highlightData.push({
      type: "streak",
      title: `${streakCount}-Win Streak!`,
      description: `${agent.persona} ${agent.address.slice(0, 8)}... is on a ${streakCount}-prediction winning streak`,
      agent_address: agent.address,
      agent_persona: agent.persona,
      streak_count: streakCount,
      timestamp: new Date(now.getTime() - randomInt(0, 48) * 60 * 60 * 1000),
    });
  }

  for (let i = 0; i < 3; i++) {
    const agent = randomChoice(agents);
    highlightData.push({
      type: "top_earner",
      title: `Top Earner of the Day`,
      description: `${agent.persona} ${agent.address.slice(0, 8)}... earned ${randomInt(2000, 8000)} $PRED today with ${randomFloat(60, 80)}% accuracy`,
      agent_address: agent.address,
      agent_persona: agent.persona,
      earned: randomFloat(2000, 8000),
      accuracy: randomFloat(60, 80),
      timestamp: new Date(now.getTime() - randomInt(0, 72) * 60 * 60 * 1000),
    });
  }

  highlightData.push({
    type: "persona_flip",
    title: "Persona Flip: quant_trader overtakes macro_analyst",
    description: "quant_trader persona now leads in accuracy over macro_analyst after today's resolved markets",
    winner: "quant_trader",
    loser: "macro_analyst",
    winner_accuracy: randomFloat(62, 72),
    loser_accuracy: randomFloat(55, 65),
    timestamp: new Date(now.getTime() - randomInt(0, 24) * 60 * 60 * 1000),
  });

  highlightData.push({
    type: "milestone",
    title: "10,000 Predictions Milestone",
    description: "The network has surpassed 10,000 total predictions across all markets",
    count: 10000,
    timestamp: new Date(now.getTime() - randomInt(0, 48) * 60 * 60 * 1000),
  });

  highlightData.push({
    type: "milestone",
    title: "50 Active Agents",
    description: "50 unique agents have now participated in prediction markets",
    count: 50,
    timestamp: new Date(now.getTime() - randomInt(24, 72) * 60 * 60 * 1000),
  });

  await db.insert(highlightsTable).values(highlightData);
  console.log(`  Inserted ${highlightData.length} highlights`);

  console.log("Seed complete!");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
