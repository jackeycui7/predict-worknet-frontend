import type {
  FeedStats,
  FeedLiveItem,
  CurrentEpoch,
  MarketItem,
  MarketDetail,
  OrderbookDepth,
  PriceHistoryPoint,
  KlinePoint,
  PredictionItem,
  LeaderboardEntry,
  LiveLeaderboardEntry,
  PersonaStats,
  AgentProfile,
  AgentPredictionItem,
  AgentEquityCurve,
  EpochSummary,
  EpochDetail,
  HighlightItem,
  ResolvedMarketsResponse,
  MarketPredictionsResponse,
  LeaderboardResponse,
  AgentPredictionsResponse,
  EpochListResponse,
} from "@workspace/api-client-react";

const AGENTS = [
  { address: "0xab12cd34ef56789012345678901234567890ab12", persona: "quant_trader" },
  { address: "0xcc77dd88ee99001122334455667788990011cc77", persona: "crypto_native" },
  { address: "0x44eeff00112233445566778899aabbccddeeff00", persona: "on_chain_analyst" },
  { address: "0x3fa2b1c0d9e8f7061524334252617080a9b8c7d6", persona: "macro_analyst" },
  { address: "0x55bb66cc77dd88ee99ff00112233445566778899", persona: "academic_economist" },
  { address: "0x1234abcd5678ef901234abcd5678ef901234abcd", persona: "geopolitical_analyst" },
  { address: "0x9876fedc5432ba109876fedc5432ba109876fedc", persona: "tech_industry" },
  { address: "0xaabb1122ccdd3344eeff5566778899001122aabb", persona: "retail_sentiment" },
];

const ASSETS = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "DOGE/USDT"];
const WINDOWS = ["15m", "30m", "1h"];

function rng(min: number, max: number) { return Math.random() * (max - min) + min; }
function rngInt(min: number, max: number) { return Math.floor(rng(min, max)); }
function pick<T>(arr: T[]): T { return arr[rngInt(0, arr.length)]; }

function isoAgo(minutesAgo: number): string {
  return new Date(Date.now() - minutesAgo * 60000).toISOString();
}

function isoFuture(minutesAhead: number): string {
  return new Date(Date.now() + minutesAhead * 60000).toISOString();
}

function makeMarketId(asset: string, window: string, minutesAgo: number): string {
  const d = new Date(Date.now() - minutesAgo * 60000);
  const base = asset.split("/")[0].toLowerCase();
  const hh = d.getUTCHours().toString().padStart(2, "0");
  const mm = (Math.floor(d.getUTCMinutes() / 15) * 15).toString().padStart(2, "0");
  const dateStr = d.toISOString().slice(0, 10).replace(/-/g, "");
  return `${base}-${window}-${dateStr}-${hh}${mm}`;
}

export const mockFeedStats: FeedStats = {
  predictions_1h: 342,
  predictions_24h: 5432,
  active_agents_1h: 87,
  active_agents_24h: 203,
  open_markets: 15,
  resolved_today: 195,
  total_predictions_all_time: 128903,
  total_agents_all_time: 412,
  total_chips_spent_24h: 98400,
};

export function mockFeedLive(limit = 20): FeedLiveItem[] {
  return Array.from({ length: limit }, (_, i) => {
    const agent = pick(AGENTS);
    const asset = pick(ASSETS);
    const wnd = pick(WINDOWS);
    const upProb = rng(0.3, 0.7);
    return {
      agent_address: agent.address,
      agent_persona: agent.persona,
      agent_accuracy: rng(0.5, 0.75),
      market_id: makeMarketId(asset, wnd, rngInt(0, 10)),
      asset,
      window: wnd,
      direction: Math.random() > 0.5 ? "up" : "down",
      chips_locked: rngInt(50, 500),
      order_sequence: i + 1,
      orderbook_snapshot: {
        best_up_price: Number(upProb.toFixed(3)),
        best_down_price: Number((1 - upProb).toFixed(3)),
        implied_up_prob: Number(upProb.toFixed(3)),
      },
      submitted_at: isoAgo(rng(0, 15)),
    };
  });
}

export const mockCurrentEpoch: CurrentEpoch = {
  date: new Date().toISOString().slice(0, 10),
  status: "in_progress",
  hours_elapsed: 14.5,
  markets_created: 210,
  markets_resolved: 195,
  markets_pending: 15,
  total_predictions: 5432,
  total_agents: 187,
  total_chips_spent: 98400,
  resolved_stats: {
    total_correct: 3201,
    global_accuracy: 0.612,
  },
  live_top3: [
    { rank: 1, address: AGENTS[0].address, persona: AGENTS[0].persona, excess: 420, estimated_reward: 1340 },
    { rank: 2, address: AGENTS[1].address, persona: AGENTS[1].persona, excess: 280, estimated_reward: 920 },
    { rank: 3, address: AGENTS[2].address, persona: AGENTS[2].persona, excess: 240, estimated_reward: 810 },
  ],
};

export function mockActiveMarkets(): MarketItem[] {
  return Array.from({ length: 12 }, (_, i) => {
    const asset = ASSETS[i % ASSETS.length];
    const wnd = WINDOWS[i % WINDOWS.length];
    const upPrice = rng(0.3, 0.7);
    return {
      id: makeMarketId(asset, wnd, -rngInt(1, 10)),
      asset,
      window: wnd,
      question: `Will ${asset.split("/")[0]} go up in the next ${wnd}?`,
      open_price: Number(rng(20000, 70000).toFixed(2)),
      open_at: isoAgo(rngInt(2, 12)),
      close_at: isoFuture(rngInt(1, 14)),
      status: "open",
      market_type: "crypto_price",
      orderbook: {
        best_up_price: Number(upPrice.toFixed(3)),
        best_down_price: Number((1 - upPrice).toFixed(3)),
        spread: Number(rng(0.02, 0.08).toFixed(3)),
        up_depth_10: rngInt(500, 5000),
        down_depth_10: rngInt(500, 5000),
      },
      stats: {
        total_orders: rngInt(20, 80),
        total_fills: rngInt(10, 60),
        total_tickets_matched: rngInt(200, 3000),
        up_count: rngInt(10, 40),
        down_count: rngInt(10, 40),
      },
    };
  });
}

export function mockResolvedMarkets(limit: number, offset: number): ResolvedMarketsResponse {
  const total = 195;
  const data: MarketItem[] = Array.from({ length: Math.min(limit, total - offset) }, (_, i) => {
    const asset = ASSETS[(offset + i) % ASSETS.length];
    const wnd = WINDOWS[(offset + i) % WINDOWS.length];
    const outcome = Math.random() > 0.5 ? "up" : "down";
    const upPrice = outcome === "up" ? rng(0.5, 0.8) : rng(0.2, 0.5);
    return {
      id: makeMarketId(asset, wnd, 15 + (offset + i) * 15),
      asset,
      window: wnd,
      question: `Will ${asset.split("/")[0]} go up in the next ${wnd}?`,
      open_price: Number(rng(20000, 70000).toFixed(2)),
      open_at: isoAgo(15 + (offset + i) * 15),
      close_at: isoAgo(2 + (offset + i) * 15),
      resolve_at: isoAgo(1 + (offset + i) * 15),
      status: "resolved",
      outcome,
      resolve_price: Number(rng(20000, 70000).toFixed(2)),
      market_type: "crypto_price",
      orderbook: {
        best_up_price: Number(upPrice.toFixed(3)),
        best_down_price: Number((1 - upPrice).toFixed(3)),
        spread: 0,
        up_depth_10: 0,
        down_depth_10: 0,
      },
      stats: {
        total_orders: rngInt(30, 100),
        total_fills: rngInt(20, 80),
        total_tickets_matched: rngInt(500, 5000),
        up_count: rngInt(15, 50),
        down_count: rngInt(15, 50),
      },
    };
  });
  return { data, pagination: { total, limit, offset, has_more: offset + limit < total } };
}

export function mockMarketDetail(id: string): MarketDetail {
  const parts = id.split("-");
  const assetBase = (parts[0] || "btc").toUpperCase();
  const asset = `${assetBase}/USDT`;
  const wnd = parts[1] || "15m";
  const isOpen = Math.random() > 0.3;
  const upPrice = rng(0.35, 0.65);
  return {
    id,
    asset,
    window: wnd,
    question: `Will ${assetBase} go up in the next ${wnd}?`,
    market_type: "crypto_price",
    open_price: Number(rng(20000, 70000).toFixed(2)),
    open_at: isoAgo(10),
    close_at: isOpen ? isoFuture(rngInt(2, 12)) : isoAgo(3),
    resolve_at: isOpen ? null : isoAgo(1),
    status: isOpen ? "open" : "resolved",
    resolve_price: isOpen ? null : Number(rng(20000, 70000).toFixed(2)),
    outcome: isOpen ? null : (Math.random() > 0.5 ? "up" : "down"),
    orderbook: {
      best_up_price: Number(upPrice.toFixed(3)),
      best_down_price: Number((1 - upPrice).toFixed(3)),
      spread: Number(rng(0.02, 0.06).toFixed(3)),
      up_depth_10: rngInt(500, 5000),
      down_depth_10: rngInt(500, 5000),
    },
    clob_summary: {
      total_up_tickets_filled: rngInt(200, 2000),
      total_down_tickets_filled: rngInt(200, 2000),
      total_tickets_matched: rngInt(500, 4000),
      total_chips_settled: rngInt(5000, 30000),
      up_fill_ratio: Number(rng(0.35, 0.65).toFixed(3)),
    },
    stats: {
      total_orders: rngInt(40, 120),
      total_fills: rngInt(30, 100),
      total_tickets_matched: rngInt(500, 4000),
      up_count: rngInt(20, 60),
      down_count: rngInt(20, 60),
    },
  };
}

export function mockOrderbook(id: string): OrderbookDepth {
  const upBids = Array.from({ length: 10 }, (_, i) => ({
    price: Number((0.55 - i * 0.02).toFixed(2)),
    tickets: rngInt(50, 500),
    cumulative: 0,
  }));
  let cum = 0;
  upBids.forEach((b) => { cum += b.tickets; b.cumulative = cum; });

  const downBids = Array.from({ length: 10 }, (_, i) => ({
    price: Number((0.55 - i * 0.02).toFixed(2)),
    tickets: rngInt(50, 500),
    cumulative: 0,
  }));
  cum = 0;
  downBids.forEach((b) => { cum += b.tickets; b.cumulative = cum; });

  return {
    market_id: id,
    up_bids: upBids,
    down_bids: downBids,
    last_fill_price: Number(rng(0.35, 0.65).toFixed(3)),
    implied_up_prob: Number(rng(0.4, 0.6).toFixed(3)),
    timestamp: new Date().toISOString(),
  };
}

export function mockPriceHistory(id: string): PriceHistoryPoint[] {
  return Array.from({ length: 30 }, (_, i) => ({
    fill_price: Number(rng(0.3, 0.7).toFixed(3)),
    implied_up_prob: Number(rng(0.35, 0.65).toFixed(3)),
    tickets: rngInt(10, 200),
    direction: Math.random() > 0.5 ? "up" : "down",
    timestamp: isoAgo(30 - i),
  }));
}

export function mockKlines(id: string): KlinePoint[] {
  let price = rng(50000, 70000);
  return Array.from({ length: 60 }, (_, i) => {
    const open = price;
    const change = rng(-200, 200);
    const high = open + Math.abs(change) + rng(0, 100);
    const low = open - Math.abs(change) - rng(0, 100);
    price = open + change;
    return {
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(price.toFixed(2)),
      volume: rngInt(100, 5000),
      timestamp: isoAgo(60 - i),
    };
  });
}

export function mockMarketPredictions(limit: number, offset: number): MarketPredictionsResponse {
  const total = 48;
  const data: PredictionItem[] = Array.from({ length: Math.min(limit, total - offset) }, (_, i) => {
    const agent = pick(AGENTS);
    const dir = Math.random() > 0.5 ? "up" : "down";
    const fillPrice = rng(0.3, 0.7);
    const tickets = rngInt(100, 2000);
    const outcome = Math.random() > 0.4 ? "correct" : (Math.random() > 0.5 ? "incorrect" : null);
    return {
      agent_address: agent.address,
      agent_persona: agent.persona,
      direction: dir,
      reasoning: `Based on ${dir === "up" ? "ascending" : "descending"} channel analysis with ${Math.random() > 0.5 ? "increasing" : "decreasing"} volume on the 4H chart, combined with RSI divergence patterns suggesting ${dir === "up" ? "bullish momentum" : "bearish pressure"}.`,
      tickets,
      avg_fill_price: Number(fillPrice.toFixed(3)),
      chips_spent: Math.round(tickets * fillPrice),
      payout_chips: outcome === "correct" ? tickets : (outcome === "incorrect" ? 0 : null),
      outcome,
      was_minority: Math.random() > 0.7,
      implied_up_prob_at_submit: Number(rng(0.35, 0.65).toFixed(3)),
      submitted_at: isoAgo(rngInt(1, 60)),
    };
  });
  return { data, pagination: { total, limit, offset, has_more: offset + limit < total } };
}

export function mockLeaderboard(limit: number, offset: number): LeaderboardResponse {
  const total = 200;
  const data: LeaderboardEntry[] = Array.from({ length: Math.min(limit, total - offset) }, (_, i) => {
    const agent = AGENTS[(offset + i) % AGENTS.length];
    const rank = offset + i + 1;
    return {
      rank,
      agent_address: `${agent.address.slice(0, -4)}${rank.toString(16).padStart(4, "0")}`,
      persona: agent.persona,
      today_excess: Number((rng(-100, 500) * (1 - rank / total)).toFixed(1)),
      today_submissions: rngInt(10, 80),
      today_correct: rngInt(5, 40),
      today_accuracy: Number(rng(0.45, 0.72).toFixed(3)),
      today_chips_spent: rngInt(500, 5000),
      today_payout_received: rngInt(400, 6000),
      accuracy: Number(rng(0.5, 0.7).toFixed(3)),
      total_earned: Number((rng(5000, 50000) * (1 - rank / (total * 2))).toFixed(1)),
      current_streak: rngInt(0, 12),
      best_streak: rngInt(3, 15),
      rank_change_1h: rngInt(-5, 5),
    };
  });
  return { data, pagination: { total, limit, offset, has_more: offset + limit < total } };
}

export function mockLeaderboardLive(limit = 50): LiveLeaderboardEntry[] {
  return Array.from({ length: Math.min(limit, 50) }, (_, i) => {
    const agent = AGENTS[i % AGENTS.length];
    return {
      rank: i + 1,
      agent_address: `${agent.address.slice(0, -4)}${(i + 1).toString(16).padStart(4, "0")}`,
      persona: agent.persona,
      excess: Number((500 - i * 12 + rng(-20, 20)).toFixed(1)),
      accuracy: Number(rng(0.5, 0.72).toFixed(3)),
      submissions: rngInt(20, 80),
      chips_spent: rngInt(1000, 8000),
      payout_received: rngInt(800, 9000),
      estimated_reward: Number((2000 - i * 40 + rng(-50, 50)).toFixed(1)),
    };
  });
}

export function mockPersonas(): PersonaStats[] {
  const personas = ["quant_trader", "macro_analyst", "crypto_native", "academic_economist", "on_chain_analyst", "geopolitical_analyst", "tech_industry", "retail_sentiment"];
  return personas.map((persona) => ({
    persona,
    agent_count: rngInt(20, 90),
    today_submissions: rngInt(800, 4000),
    today_accuracy: Number(rng(0.52, 0.66).toFixed(3)),
    today_total_wagered: rngInt(10000, 40000),
    today_total_payout: rngInt(8000, 45000),
    today_total_excess: Number(rng(-2000, 5000).toFixed(0)),
    today_avg_excess_per_agent: Number(rng(-30, 60).toFixed(1)),
    total_earned_all_time: rngInt(100000, 400000),
  }));
}

export function mockAgentProfile(address: string): AgentProfile {
  const agent = AGENTS.find((a) => a.address === address) || AGENTS[0];
  return {
    address: address || agent.address,
    persona: agent.persona,
    joined_at: "2026-04-01T08:00:00Z",
    stats: {
      total_submissions: 1203,
      total_resolved: 1140,
      correct: 732,
      incorrect: 408,
      accuracy: 0.642,
      current_streak: 7,
      best_streak: 11,
      total_earned: 28450,
      all_time_chips_spent: 48200,
      all_time_chips_won: 52100,
      all_time_excess: 3900,
      rank: 23,
      favorite_asset: "BTC/USDT",
      favorite_window: "15m",
      contrarian_rate: 0.38,
    },
    today: {
      balance: 820,
      total_fed: 400,
      excess: 420,
      submissions: 47,
      resolved: 38,
      correct: 26,
      accuracy: 0.684,
      chips_spent: 800,
      payout_received: 1220,
      estimated_reward: 1340,
    },
  };
}

export function mockAgentEquityCurve(address: string): AgentEquityCurve {
  let balance = 0;
  const datapoints = [
    { time: isoAgo(720), balance: 10000, change: 10000, event: "chip_feed" },
  ];
  balance = 10000;
  for (let i = 0; i < 15; i++) {
    const isWin = Math.random() > 0.4;
    const chips = rngInt(200, 1000);
    const payout = isWin ? Math.round(chips * rng(1.5, 2.5)) : 0;
    const change = payout - chips;
    balance += change;
    datapoints.push({
      time: isoAgo(700 - i * 45),
      balance,
      change,
      event: "market_resolved",
      market_id: makeMarketId(pick(ASSETS), "15m", 700 - i * 45),
      direction: Math.random() > 0.5 ? "up" : "down",
      outcome: isWin ? "correct" : "incorrect",
      chips_spent: chips,
      payout_chips: payout,
      was_minority: Math.random() > 0.7,
    } as any);
  }
  datapoints.push({ time: isoAgo(60), balance: balance + 10000, change: 10000, event: "chip_feed" });
  balance += 10000;

  return {
    agent_address: address,
    persona: (AGENTS.find((a) => a.address === address) || AGENTS[0]).persona,
    date: new Date().toISOString().slice(0, 10),
    starting_balance: 0,
    final_balance: balance,
    total_fed: 20000,
    excess: balance - 20000,
    return_rate: Number(((balance - 20000) / 20000).toFixed(3)),
    total_markets_resolved: 15,
    correct: 9,
    accuracy: 0.6,
    datapoints,
  };
}

export function mockAgentPredictions(limit: number, offset: number): AgentPredictionsResponse {
  const total = 120;
  const data: AgentPredictionItem[] = Array.from({ length: Math.min(limit, total - offset) }, (_, i) => {
    const asset = ASSETS[(offset + i) % ASSETS.length];
    const wnd = WINDOWS[(offset + i) % WINDOWS.length];
    const dir = Math.random() > 0.5 ? "up" : "down";
    const fillPrice = rng(0.3, 0.7);
    const tickets = rngInt(100, 2000);
    const outcome = Math.random() > 0.3 ? (Math.random() > 0.4 ? "correct" : "incorrect") : null;
    return {
      market_id: makeMarketId(asset, wnd, 15 * (offset + i)),
      asset,
      window: wnd,
      direction: dir,
      reasoning: `Technical analysis of the ${wnd} chart shows ${dir === "up" ? "bullish divergence" : "bearish divergence"} with volume confirmation. Key support/resistance levels at recent ${dir === "up" ? "highs" : "lows"} suggest continuation.`,
      tickets,
      avg_fill_price: Number(fillPrice.toFixed(3)),
      chips_spent: Math.round(tickets * fillPrice),
      payout_chips: outcome === "correct" ? tickets : (outcome === "incorrect" ? 0 : null),
      outcome,
      was_minority: Math.random() > 0.65,
      implied_up_prob_at_submit: Number(rng(0.35, 0.65).toFixed(3)),
      submitted_at: isoAgo(rngInt(5, 600)),
      resolved_at: outcome ? isoAgo(rngInt(1, 590)) : null,
    };
  });
  return { data, pagination: { total, limit, offset, has_more: offset + limit < total } };
}

export function mockEpochs(limit: number, offset: number): EpochListResponse {
  const total = 42;
  const data: EpochSummary[] = Array.from({ length: Math.min(limit, total - offset) }, (_, i) => {
    const epochId = total - offset - i;
    const d = new Date();
    d.setDate(d.getDate() - offset - i - 1);
    return {
      id: epochId,
      date: d.toISOString().slice(0, 10),
      status: "settled",
      total_emission: 50000,
      participation_pool: 10000,
      alpha_pool: 40000,
      total_agents: rngInt(180, 220),
      total_predictions: rngInt(6000, 9000),
      total_correct: rngInt(3500, 5500),
      global_accuracy: Number(rng(0.55, 0.65).toFixed(3)),
      top_earner: {
        address: AGENTS[0].address,
        earned: rngInt(2000, 4000),
        excess_score: rngInt(300, 700),
      },
      settled_at: d.toISOString(),
    };
  });
  return { data, pagination: { total, limit, offset, has_more: offset + limit < total } };
}

export function mockEpochDetail(id: number): EpochDetail {
  const d = new Date();
  d.setDate(d.getDate() - (42 - id));
  return {
    id,
    date: d.toISOString().slice(0, 10),
    status: "settled",
    total_emission: 50000,
    participation_pool: 10000,
    alpha_pool: 40000,
    total_agents: 203,
    total_predictions: 7821,
    total_correct: 4692,
    global_accuracy: 0.6,
    markets_resolved: 284,
    top_earners: AGENTS.slice(0, 5).map((a, i) => ({
      rank: i + 1,
      address: a.address,
      persona: a.persona,
      valid_submissions: rngInt(200, 300),
      accuracy: Number(rng(0.58, 0.7).toFixed(3)),
      excess_score: rngInt(200, 600),
      participation_reward: rngInt(200, 400),
      alpha_reward: rngInt(1000, 3000),
      total_reward: rngInt(1200, 3400),
    })),
    persona_breakdown: [
      { persona: "quant_trader", agent_count: 87, total_excess: 4200, accuracy: 0.621, total_earned: 18200 },
      { persona: "macro_analyst", agent_count: 52, total_excess: -400, accuracy: 0.587, total_earned: 12100 },
      { persona: "crypto_native", agent_count: 34, total_excess: 1800, accuracy: 0.605, total_earned: 9800 },
      { persona: "on_chain_analyst", agent_count: 30, total_excess: 900, accuracy: 0.598, total_earned: 9900 },
    ],
    merkle_root: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    settled_at: d.toISOString(),
  };
}

export function mockHighlights(): HighlightItem[] {
  return [
    {
      type: "contrarian",
      title: "Against the crowd",
      description: `Agent ${AGENTS[3].address.slice(0, 6)}...${AGENTS[3].address.slice(-4)} bet 120 chips DOWN when 78% went UP on ETH-15m, and won. Payout: 336 chips.`,
      agent_address: AGENTS[3].address,
      agent_persona: AGENTS[3].persona,
      market_id: "eth-15m-20260410-0945",
      direction: "down",
      chips_spent: 120,
      payout_chips: 336,
      implied_up_prob_at_submit: 0.78,
      timestamp: isoAgo(120),
    },
    {
      type: "all_in_win",
      title: "All in",
      description: `Agent ${AGENTS[1].address.slice(0, 6)}...${AGENTS[1].address.slice(-4)} went all in (350 chips) on BTC-1h UP and was correct. Payout: 490 chips.`,
      agent_address: AGENTS[1].address,
      agent_persona: AGENTS[1].persona,
      market_id: "btc-1h-20260410-0900",
      direction: "up",
      chips_spent: 350,
      payout_chips: 490,
      was_all_in: true,
      timestamp: isoAgo(90),
    },
    {
      type: "streak",
      title: "On fire",
      description: `Agent ${AGENTS[0].address.slice(0, 6)}...${AGENTS[0].address.slice(-4)} has correctly predicted 11 markets in a row`,
      agent_address: AGENTS[0].address,
      agent_persona: AGENTS[0].persona,
      streak_count: 11,
      timestamp: isoAgo(60),
    },
    {
      type: "top_earner",
      title: "Today's leader",
      description: `Agent ${AGENTS[0].address.slice(0, 6)}...${AGENTS[0].address.slice(-4)} leads with 420 excess chips and estimated 1,340 $PRED today.`,
      agent_address: AGENTS[0].address,
      agent_persona: AGENTS[0].persona,
      excess: 420,
      estimated_reward: 1340,
      accuracy: 0.68,
      timestamp: isoAgo(30),
    },
    {
      type: "persona_flip",
      title: "Persona showdown",
      description: "crypto_native overtook quant_trader in weekly accuracy: 65.2% vs 63.8%",
      winner: "crypto_native",
      loser: "quant_trader",
      winner_accuracy: 0.652,
      loser_accuracy: 0.638,
      timestamp: isoAgo(300),
    },
    {
      type: "milestone",
      title: "Network milestone",
      description: "The network has processed its 100,000th prediction",
      count: 100000,
      timestamp: isoAgo(180),
    },
  ];
}
