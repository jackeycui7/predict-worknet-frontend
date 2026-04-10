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
    return <div className="px-8 py-10 text-muted-foreground text-sm">Loading market...</div>;
  }

  return (
    <div className="px-8 py-8 space-y-8">
      <div className="animate-fade-up">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">{market.asset}</h1>
          <span className="text-[10px] font-medium text-muted-foreground px-2 py-0.5 bg-muted">{market.window}</span>
          <span className={`text-[10px] font-medium px-2 py-0.5 ${market.status === "open" ? "bg-primary/10 text-primary" : "bg-muted text-foreground"}`}>
            {market.status.toUpperCase()}
          </span>
          {market.status === "open" && <span className="text-sm font-mono font-semibold text-primary">{countdown}</span>}
        </div>
        <p className="text-sm text-muted-foreground">{market.question}</p>
        <p className="text-xs font-mono text-muted-foreground/50 mt-1">{market.id}</p>
      </div>

      <div className="grid grid-cols-2 gap-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <div className="border border-border/60 bg-white p-5">
          <div className="text-xs font-semibold text-muted-foreground tracking-wide mb-4 pb-2 border-b border-border/40">MARKET INFO</div>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Open Price</span><span className="font-semibold">{formatPrice(market.open_price)}</span></div>
            {market.resolve_price != null && <div className="flex justify-between"><span className="text-muted-foreground">Close Price</span><span className="font-semibold">{formatPrice(market.resolve_price)}</span></div>}
            {market.outcome && <div className="flex justify-between"><span className="text-muted-foreground">Outcome</span><span className={`font-semibold ${market.outcome === "up" ? "text-primary" : "text-destructive"}`}>{market.outcome.toUpperCase()}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Total Orders</span><span className="font-semibold">{market.stats.total_orders}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tickets Matched</span><span className="font-semibold">{formatNumber(market.stats.total_tickets_matched)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Up / Down</span><span className="font-semibold">{market.stats.up_count} / {market.stats.down_count}</span></div>
          </div>
        </div>
        <div className="border border-border/60 bg-white p-5">
          <div className="text-xs font-semibold text-muted-foreground tracking-wide mb-4 pb-2 border-b border-border/40">ORDER BOOK</div>
          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-primary font-semibold">Best UP</span>
              <span className="text-3xl font-bold text-primary tracking-tight">{formatPct(market.orderbook.best_up_price)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-destructive font-semibold">Best DOWN</span>
              <span className="text-3xl font-bold text-destructive tracking-tight">{formatPct(market.orderbook.best_down_price)}</span>
            </div>
            <div className="pt-2 border-t border-border/40 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Spread</span><span className="font-semibold">{formatPct(market.orderbook.spread)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">UP Depth (10)</span><span className="font-semibold">{formatNumber(market.orderbook.up_depth_10)} tix</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">DOWN Depth (10)</span><span className="font-semibold">{formatNumber(market.orderbook.down_depth_10)} tix</span></div>
            </div>
            <div className="pt-2 border-t border-border/40 space-y-2 text-sm">
              <div className="text-xs font-semibold text-muted-foreground tracking-wide mb-1">CLOB SUMMARY</div>
              <div className="flex justify-between"><span className="text-muted-foreground">UP Tickets Filled</span><span className="font-semibold">{formatNumber(market.clob_summary.total_up_tickets_filled)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">DOWN Tickets Filled</span><span className="font-semibold">{formatNumber(market.clob_summary.total_down_tickets_filled)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Chips Settled</span><span className="font-semibold">{formatChips(market.clob_summary.total_chips_settled)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">UP Fill Ratio</span><span className="font-semibold">{formatPct(market.clob_summary.up_fill_ratio)}</span></div>
            </div>
          </div>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="border border-border/60 bg-white p-5 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="text-xs font-semibold text-muted-foreground tracking-wide mb-4 pb-2 border-b border-border/40">PRICE HISTORY</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(230,10%,92%)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(230,8%,55%)" }} />
              <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: "hsl(230,8%,55%)" }} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid hsl(230,10%,88%)", color: "hsl(230,25%,10%)", fontSize: 12, borderRadius: 0 }} />
              <Line type="monotone" dataKey="prob" name="Implied UP Prob" stroke="hsl(237,100%,50%)" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="animate-fade-up" style={{ animationDelay: "0.3s" }}>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-foreground tracking-tight">Predictions</h2>
          <select
            value={outcomeFilter}
            onChange={(e) => { setOutcomeFilter(e.target.value); setOffset(0); setAccumulated([]); }}
            className="bg-white border border-border/60 px-3 py-1.5 text-sm text-foreground"
          >
            <option value="">All</option>
            <option value="correct">Correct</option>
            <option value="incorrect">Incorrect</option>
          </select>
        </div>
        <div className="space-y-1">
          {accumulated.map((p, i) => {
            const expanded = expandedIdx.has(i);
            return (
              <div key={`${p.agent_address}-${p.submitted_at}`} className="border border-border/60 bg-white">
                <div
                  className="px-4 py-2.5 flex items-center gap-3 text-[12px] cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => setExpandedIdx((prev) => { const next = new Set(prev); expanded ? next.delete(i) : next.add(i); return next; })}
                >
                  <AgentLink address={p.agent_address} />
                  <span className="text-muted-foreground text-[11px]">{personaLabel(p.agent_persona)}</span>
                  <span className={`font-semibold ${p.direction === "up" ? "text-primary" : "text-destructive"}`}>{p.direction.toUpperCase()}</span>
                  <span className="text-foreground">{p.tickets} tix @ {p.avg_fill_price.toFixed(2)}</span>
                  <span className="text-primary font-mono text-[11px]">{formatChips(p.chips_spent)} chips</span>
                  {p.payout_chips != null && <span className="text-foreground font-mono text-[11px]">→ {formatChips(p.payout_chips)}</span>}
                  {p.was_minority && <span className="text-amber-500 text-[10px] font-medium">MINORITY</span>}
                  {p.outcome && <span className={`ml-auto font-semibold ${p.outcome === "correct" ? "text-primary" : "text-destructive"}`}>{p.outcome.toUpperCase()}</span>}
                  <span className="text-muted-foreground text-[11px]">{relativeTime(p.submitted_at)}</span>
                  <span className="text-primary text-[11px]">{expanded ? "−" : "+"}</span>
                </div>
                {expanded && (
                  <div className="px-4 py-3 border-t border-border/30 text-[12px] text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {p.reasoning}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {preds?.pagination?.has_more && (
          <button
            onClick={() => setOffset((o) => o + limit)}
            className="w-full mt-4 py-2.5 text-sm font-medium text-primary border border-primary hover:bg-primary hover:text-white transition-colors"
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );
}
