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
    <div className="p-4 space-y-4">
      <div className="bento-card p-6 animate-fade-up">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">{market.asset}</h1>
          <span className="text-[9px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5">{market.window}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 tracking-[0.06em] ${market.status === "open" ? "bg-primary text-white" : "bg-muted text-foreground"}`}>
            {market.status.toUpperCase()}
          </span>
          {market.status === "open" && <span className="text-sm font-mono font-bold text-primary">{countdown}</span>}
        </div>
        <p className="text-[12px] text-muted-foreground mt-1">{market.question}</p>
        <p className="text-[10px] font-mono text-muted-foreground/40 mt-1">{market.id}</p>
      </div>

      <div className="grid grid-cols-3 gap-[1px] bg-border animate-fade-up" style={{ animationDelay: "0.05s" }}>
        <div className="bento-card p-5">
          <div className="section-label mb-3">MARKET INFO</div>
          <div className="space-y-2 text-[12px]">
            <div className="flex justify-between"><span className="text-muted-foreground">Open Price</span><span className="font-bold">{formatPrice(market.open_price)}</span></div>
            {market.resolve_price != null && <div className="flex justify-between"><span className="text-muted-foreground">Close Price</span><span className="font-bold">{formatPrice(market.resolve_price)}</span></div>}
            {market.outcome && <div className="flex justify-between"><span className="text-muted-foreground">Outcome</span><span className={`font-bold ${market.outcome === "up" ? "text-primary" : "text-destructive"}`}>{market.outcome.toUpperCase()}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Total Orders</span><span className="font-bold">{market.stats.total_orders}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tickets Matched</span><span className="font-bold">{formatNumber(market.stats.total_tickets_matched)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Up / Down</span><span className="font-bold">{market.stats.up_count} / {market.stats.down_count}</span></div>
          </div>
        </div>
        <div className="bento-card p-5">
          <div className="section-label mb-3">ORDER BOOK</div>
          <div className="space-y-2.5">
            <div className="flex justify-between items-baseline">
              <span className="text-[11px] text-primary font-semibold">BEST UP</span>
              <span className="text-3xl font-black text-primary tracking-tight">{formatPct(market.orderbook.best_up_price)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[11px] text-destructive font-semibold">BEST DOWN</span>
              <span className="text-3xl font-black text-destructive tracking-tight">{formatPct(market.orderbook.best_down_price)}</span>
            </div>
            <div className="pt-2 border-t border-border/40 space-y-1.5 text-[12px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Spread</span><span className="font-bold">{formatPct(market.orderbook.spread)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">UP Depth</span><span className="font-bold">{formatNumber(market.orderbook.up_depth_10)} tix</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">DOWN Depth</span><span className="font-bold">{formatNumber(market.orderbook.down_depth_10)} tix</span></div>
            </div>
          </div>
        </div>
        <div className="bento-card p-5">
          <div className="section-label mb-3">CLOB SUMMARY</div>
          <div className="space-y-2 text-[12px]">
            <div className="flex justify-between"><span className="text-muted-foreground">UP Filled</span><span className="font-bold">{formatNumber(market.clob_summary.total_up_tickets_filled)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">DOWN Filled</span><span className="font-bold">{formatNumber(market.clob_summary.total_down_tickets_filled)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Chips Settled</span><span className="font-bold">{formatChips(market.clob_summary.total_chips_settled)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">UP Fill Ratio</span><span className="font-bold">{formatPct(market.clob_summary.up_fill_ratio)}</span></div>
          </div>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="bento-card p-5 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="section-label mb-4">PRICE HISTORY</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,8%,92%)" />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: "hsl(220,8%,46%)" }} />
              <YAxis domain={[0, 1]} tick={{ fontSize: 9, fill: "hsl(220,8%,46%)" }} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid hsl(220,8%,88%)", fontSize: 11, borderRadius: 0 }} />
              <Line type="monotone" dataKey="prob" name="Implied UP" stroke="hsl(230,80%,56%)" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bento-card animate-fade-up" style={{ animationDelay: "0.15s" }}>
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
          <span className="section-label">PREDICTIONS</span>
          <select
            value={outcomeFilter}
            onChange={(e) => { setOutcomeFilter(e.target.value); setOffset(0); setAccumulated([]); }}
            className="bg-white border border-border px-2 py-1 text-[10px] font-medium text-foreground tracking-[0.04em]"
          >
            <option value="">ALL</option>
            <option value="correct">CORRECT</option>
            <option value="incorrect">INCORRECT</option>
          </select>
        </div>
        {accumulated.map((p, i) => {
          const expanded = expandedIdx.has(i);
          return (
            <div key={`${p.agent_address}-${p.submitted_at}`} className="border-b border-border/50">
              <div
                className="px-5 py-2 flex items-center gap-2 text-[11px] cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedIdx((prev) => { const next = new Set(prev); expanded ? next.delete(i) : next.add(i); return next; })}
              >
                <AgentLink address={p.agent_address} />
                <span className="text-[10px] text-muted-foreground">{personaLabel(p.agent_persona)}</span>
                <span className={`font-bold text-[10px] tracking-wider ${p.direction === "up" ? "text-primary" : "text-destructive"}`}>{p.direction.toUpperCase()}</span>
                <span className="text-foreground">{p.tickets} tix @ {p.avg_fill_price.toFixed(2)}</span>
                <span className="text-primary font-mono text-[10px]">{formatChips(p.chips_spent)}</span>
                {p.payout_chips != null && <span className="font-mono text-[10px]">→ {formatChips(p.payout_chips)}</span>}
                {p.was_minority && <span className="text-amber-500 text-[9px] font-bold tracking-wider">MINORITY</span>}
                {p.outcome && <span className={`ml-auto font-bold text-[10px] tracking-wider ${p.outcome === "correct" ? "text-primary" : "text-destructive"}`}>{p.outcome.toUpperCase()}</span>}
                <span className="text-muted-foreground/50 text-[10px]">{relativeTime(p.submitted_at)}</span>
              </div>
              {expanded && (
                <div className="px-5 py-3 border-t border-border/30 text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed bg-muted/20">
                  {p.reasoning}
                </div>
              )}
            </div>
          );
        })}
        {preds?.pagination?.has_more && (
          <button
            onClick={() => setOffset((o) => o + limit)}
            className="w-full py-2 text-[11px] font-semibold tracking-[0.06em] text-primary border-t border-border hover:bg-muted/30 transition-colors uppercase"
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );
}
