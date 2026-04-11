import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import {
  useGetMarketById,
  useGetMarketPriceHistory,
  useGetMarketPredictions,
} from "@/lib/api";
import type { PredictionItem } from "@workspace/api-client-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatPct, formatPrice, formatChips, formatNumber, relativeTime, countdownStr, personaLabel } from "@/lib/format";
import { AgentLink } from "@/components/address-link";

export default function MarketDetail() {
  const [, params] = useRoute("/markets/:id");
  const id = params?.id ?? "";

  const [offset, setOffset] = useState(0);
  const [outcomeFilter, setOutcomeFilter] = useState("");
  const [accumulated, setAccumulated] = useState<PredictionItem[]>([]);
  const [expandedIdx, setExpandedIdx] = useState<Set<number>>(new Set());
  const filterKey = useRef("");
  const limit = 20;

  const { data: market } = useGetMarketById(id);
  const { data: priceHistory } = useGetMarketPriceHistory(id);
  const { data: preds } = useGetMarketPredictions(id, { limit, offset, outcome: outcomeFilter || undefined });

  const currentFilterKey = `${id}-${outcomeFilter}`;
  useEffect(() => {
    if (currentFilterKey !== filterKey.current) {
      filterKey.current = currentFilterKey;
      setAccumulated([]);
      setOffset(0);
      setExpandedIdx(new Set());
    }
  }, [currentFilterKey]);

  useEffect(() => {
    if (preds?.data) {
      if (offset === 0) {
        setAccumulated(preds.data);
      } else {
        setAccumulated((prev) => {
          const existingKeys = new Set(prev.map((p) => `${p.agent_address}-${p.submitted_at}`));
          const newItems = preds.data.filter((p) => !existingKeys.has(`${p.agent_address}-${p.submitted_at}`));
          return [...prev, ...newItems];
        });
      }
    }
  }, [preds?.data, offset]);

  const [countdown, setCountdown] = useState("");
  useEffect(() => {
    if (!market) return;
    const tick = () => setCountdown(countdownStr(market.close_at));
    tick();
    const id2 = setInterval(tick, 1000);
    return () => clearInterval(id2);
  }, [market?.close_at]);

  const chartData = priceHistory?.map((p) => ({
    time: new Date(p.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    prob: p.implied_up_prob,
  })) ?? [];

  if (!market) {
    return <div className="p-6 text-muted-foreground text-sm">Loading market...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="glass-card p-6 animate-fade-up">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-[-0.02em] text-foreground">{market.asset}</h1>
          <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">{market.window}</span>
          <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${market.status === "open" ? "bg-primary/10 text-primary" : "bg-muted text-foreground"}`}>
            {market.status}
          </span>
          {market.status === "open" && <span className="text-sm font-mono font-bold text-primary">{countdown}</span>}
        </div>
        <p className="text-[12px] text-muted-foreground mt-1">{market.question}</p>
        <p className="text-[10px] font-mono text-muted-foreground/30 mt-1">{market.id}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 animate-fade-up" style={{ animationDelay: "0.05s" }}>
        <div className="glass-card p-5">
          <div className="text-[12px] font-semibold text-muted-foreground/70 mb-3">Market Info</div>
          <div className="space-y-2 text-[12px]">
            <div className="flex justify-between"><span className="text-muted-foreground">Open Price</span><span className="font-bold">{formatPrice(market.open_price)}</span></div>
            {market.resolve_price != null && <div className="flex justify-between"><span className="text-muted-foreground">Close Price</span><span className="font-bold">{formatPrice(market.resolve_price)}</span></div>}
            {market.outcome && <div className="flex justify-between"><span className="text-muted-foreground">Outcome</span><span className={`font-bold ${market.outcome === "up" ? "text-primary" : "text-destructive"}`}>{market.outcome.toUpperCase()}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Total Orders</span><span className="font-bold">{market.stats.total_orders}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tickets Matched</span><span className="font-bold">{formatNumber(market.stats.total_tickets_matched)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Up / Down</span><span className="font-bold">{market.stats.up_count} / {market.stats.down_count}</span></div>
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="text-[12px] font-semibold text-muted-foreground/70 mb-3">Order Book</div>
          <div className="space-y-2.5">
            <div className="flex justify-between items-baseline">
              <span className="text-[11px] text-primary font-medium">Best UP</span>
              <span className="text-3xl font-bold text-primary tracking-tight">{formatPct(market.orderbook.best_up_price)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[11px] text-destructive font-medium">Best DOWN</span>
              <span className="text-3xl font-bold text-destructive tracking-tight">{formatPct(market.orderbook.best_down_price)}</span>
            </div>
            <div className="pt-2 border-t border-black/[0.06] space-y-1.5 text-[12px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Spread</span><span className="font-bold">{formatPct(market.orderbook.spread)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">UP Depth</span><span className="font-bold">{formatNumber(market.orderbook.up_depth_10)} tix</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">DOWN Depth</span><span className="font-bold">{formatNumber(market.orderbook.down_depth_10)} tix</span></div>
            </div>
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="text-[12px] font-semibold text-muted-foreground/70 mb-3">CLOB Summary</div>
          <div className="space-y-2 text-[12px]">
            <div className="flex justify-between"><span className="text-muted-foreground">UP Filled</span><span className="font-bold">{formatNumber(market.clob_summary.total_up_tickets_filled)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">DOWN Filled</span><span className="font-bold">{formatNumber(market.clob_summary.total_down_tickets_filled)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Chips Settled</span><span className="font-bold">{formatChips(market.clob_summary.total_chips_settled)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">UP Fill Ratio</span><span className="font-bold">{formatPct(market.clob_summary.up_fill_ratio)}</span></div>
          </div>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="glass-card p-5 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="text-[12px] font-semibold text-muted-foreground/70 mb-4">Price History</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: "hsl(220,8%,46%)" }} />
              <YAxis domain={[0, 1]} tick={{ fontSize: 9, fill: "hsl(220,8%,46%)" }} />
              <Tooltip contentStyle={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,0,0,0.08)", fontSize: 11, borderRadius: 12 }} />
              <Line type="monotone" dataKey="prob" name="Implied UP" stroke="hsl(230,80%,56%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="glass-card overflow-hidden animate-fade-up" style={{ animationDelay: "0.15s" }}>
        <div className="flex items-center gap-3 px-5 py-3 border-b border-black/[0.06]">
          <span className="text-[12px] font-semibold text-foreground">Predictions</span>
          <select
            value={outcomeFilter}
            onChange={(e) => { setOutcomeFilter(e.target.value); setOffset(0); setAccumulated([]); }}
            className="bg-white/60 backdrop-blur border border-white/50 px-2 py-1 text-[10px] font-medium text-foreground rounded-lg"
          >
            <option value="">All</option>
            <option value="correct">Correct</option>
            <option value="incorrect">Incorrect</option>
          </select>
        </div>
        {accumulated.map((p, i) => {
          const expanded = expandedIdx.has(i);
          return (
            <div key={`${p.agent_address}-${p.submitted_at}`} className="border-b border-black/[0.04]">
              <div
                className="px-5 py-2 flex items-center gap-2 text-[11px] cursor-pointer hover:bg-black/[0.02] transition-colors"
                onClick={() => setExpandedIdx((prev) => { const next = new Set(prev); expanded ? next.delete(i) : next.add(i); return next; })}
              >
                <AgentLink address={p.agent_address} />
                <span className="text-[10px] text-muted-foreground">{personaLabel(p.agent_persona)}</span>
                <span className={`font-bold text-[10px] tracking-wider ${p.direction === "up" ? "text-primary" : "text-destructive"}`}>{p.direction.toUpperCase()}</span>
                <span className="text-foreground">{p.tickets} tix @ {p.avg_fill_price.toFixed(2)}</span>
                <span className="text-primary font-mono text-[10px]">{formatChips(p.chips_spent)}</span>
                {p.payout_chips != null && <span className="font-mono text-[10px]">{formatChips(p.payout_chips)}</span>}
                {p.was_minority && <span className="text-amber-500 text-[9px] font-bold tracking-wider">MINORITY</span>}
                {p.outcome && <span className={`ml-auto font-bold text-[10px] tracking-wider ${p.outcome === "correct" ? "text-primary" : "text-destructive"}`}>{p.outcome.toUpperCase()}</span>}
                <span className="text-muted-foreground/50 text-[10px]">{relativeTime(p.submitted_at)}</span>
              </div>
              {expanded && (
                <div className="px-5 py-3 border-t border-black/[0.04] text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed bg-black/[0.01]">
                  {p.reasoning}
                </div>
              )}
            </div>
          );
        })}
        {preds?.pagination?.has_more && (
          <button
            onClick={() => setOffset((o) => o + limit)}
            className="w-full py-2.5 text-[12px] font-semibold text-primary border-t border-black/[0.06] hover:bg-black/[0.02] transition-colors"
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );
}
