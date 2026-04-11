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

  const chartData = priceHistory?.map((p) => {
    // Handle both ISO string and unix timestamp formats
    const ts = typeof p.timestamp === "number" ? p.timestamp * 1000 : p.timestamp;
    const date = new Date(ts);
    const time = isNaN(date.getTime()) ? "—" : date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const prob = typeof p.implied_up_prob === "string" ? parseFloat(p.implied_up_prob) : p.implied_up_prob;
    return { time, prob };
  }) ?? [];

  if (!market) {
    return <div className="p-6 text-foreground/25 text-[13px] font-light">Loading market...</div>;
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-10">
        <div className="flex items-baseline gap-4 mb-2">
          <h1 className="font-serif-editorial text-[60px] tracking-[-0.03em] text-foreground leading-[1]">{market.asset}</h1>
          <span className="text-[12px] font-light text-foreground/25">{market.window}</span>
          <span className="text-[10px] font-light text-foreground/25 tracking-[0.06em]">{market.status}</span>
          {market.status === "open" && <span className="text-[13px] font-mono font-medium text-foreground">{countdown}</span>}
        </div>
        <p className="text-[13px] text-foreground/30 font-light">{market.question}</p>
        <p className="text-[10px] font-mono text-foreground/10 mt-1">{market.id}</p>
      </div>

      <div className="grid grid-cols-3 gap-px bg-border/40 border border-border/40 mb-12">
        <div className="bg-background p-6">
          <span className="section-label">Market info</span>
          <div className="space-y-2.5 text-[12px] mt-4">
            <div className="flex justify-between"><span className="text-foreground/30 font-light">Open price</span><span className="font-medium">{formatPrice(market.open_price)}</span></div>
            {market.resolve_price != null && <div className="flex justify-between"><span className="text-foreground/30 font-light">Close price</span><span className="font-medium">{formatPrice(market.resolve_price)}</span></div>}
            {market.outcome && <div className="flex justify-between"><span className="text-foreground/30 font-light">Outcome</span><span className={`font-medium ${market.outcome === "up" ? "text-foreground" : "text-foreground/40"}`}>{market.outcome.toUpperCase()}</span></div>}
            <div className="flex justify-between"><span className="text-foreground/30 font-light">Total orders</span><span className="font-medium">{market.stats?.total_orders ?? market.prediction_count ?? 0}</span></div>
            <div className="flex justify-between"><span className="text-foreground/30 font-light">Tickets matched</span><span className="font-medium">{formatNumber(market.stats?.total_tickets_matched ?? 0)}</span></div>
            <div className="flex justify-between"><span className="text-foreground/30 font-light">Up / Down</span><span className="font-medium">{market.stats?.up_count ?? market.up_tickets_filled ?? 0} / {market.stats?.down_count ?? market.down_tickets_filled ?? 0}</span></div>
          </div>
        </div>
        <div className="bg-background p-6">
          <span className="section-label">Order book</span>
          <div className="space-y-3 mt-4">
            <div className="flex justify-between items-baseline">
              <span className="text-[11px] text-foreground/30 font-light">Best UP</span>
              <span className="font-serif-editorial text-[32px] text-foreground">{formatPct(market.orderbook?.best_up_price ?? 0.5)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[11px] text-foreground/30 font-light">Best DOWN</span>
              <span className="font-serif-editorial text-[32px] text-foreground/40">{formatPct(market.orderbook?.best_down_price ?? 0.5)}</span>
            </div>
            <div className="pt-3 border-t border-border/40 space-y-2 text-[12px]">
              <div className="flex justify-between"><span className="text-foreground/30 font-light">Spread</span><span className="font-medium">{formatPct(market.orderbook?.spread ?? 0)}</span></div>
              <div className="flex justify-between"><span className="text-foreground/30 font-light">UP depth</span><span className="font-medium">{formatNumber(market.orderbook?.up_depth_10 ?? 0)} tix</span></div>
              <div className="flex justify-between"><span className="text-foreground/30 font-light">DOWN depth</span><span className="font-medium">{formatNumber(market.orderbook?.down_depth_10 ?? 0)} tix</span></div>
            </div>
          </div>
        </div>
        <div className="bg-background p-6">
          <span className="section-label">CLOB summary</span>
          <div className="space-y-2.5 text-[12px] mt-4">
            <div className="flex justify-between"><span className="text-foreground/30 font-light">UP filled</span><span className="font-medium">{formatNumber(market.clob_summary?.total_up_tickets_filled ?? 0)}</span></div>
            <div className="flex justify-between"><span className="text-foreground/30 font-light">DOWN filled</span><span className="font-medium">{formatNumber(market.clob_summary?.total_down_tickets_filled ?? 0)}</span></div>
            <div className="flex justify-between"><span className="text-foreground/30 font-light">Chips settled</span><span className="font-medium">{formatChips(market.clob_summary?.total_chips_settled ?? 0)}</span></div>
            <div className="flex justify-between"><span className="text-foreground/30 font-light">UP fill ratio</span><span className="font-medium">{formatPct(market.clob_summary?.up_fill_ratio ?? 0)}</span></div>
          </div>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="mb-12">
          <span className="section-label">Price history</span>
          <div className="mt-4 border border-border/40 p-4">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: "rgba(0,0,0,0.2)" }} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 9, fill: "rgba(0,0,0,0.2)" }} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", fontSize: 11, borderRadius: 0 }} />
                <Line type="monotone" dataKey="prob" name="Implied UP" stroke="#111" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <span className="section-label">Predictions</span>
          <select
            value={outcomeFilter}
            onChange={(e) => { setOutcomeFilter(e.target.value); setOffset(0); setAccumulated([]); }}
            className="bg-transparent border border-border px-2 py-1 text-[10px] font-light text-foreground"
          >
            <option value="">All</option>
            <option value="correct">Correct</option>
            <option value="incorrect">Incorrect</option>
          </select>
        </div>
        <div className="border-t border-border/60">
          {accumulated.length === 0 && (
            <div className="py-8 text-center text-foreground/30 text-[13px]">No predictions yet</div>
          )}
          {accumulated.map((p, i) => {
            const expanded = expandedIdx.has(i);
            const fillPrice = typeof p.avg_fill_price === "string" ? parseFloat(p.avg_fill_price) : p.avg_fill_price;
            return (
              <div key={`${p.agent_address}-${p.submitted_at}`} className="border-b border-border/30">
                <div
                  className="py-2.5 flex items-center gap-3 text-[11px] cursor-pointer hover:bg-foreground/[0.02] transition-colors"
                  onClick={() => setExpandedIdx((prev) => { const next = new Set(prev); expanded ? next.delete(i) : next.add(i); return next; })}
                >
                  <AgentLink address={p.agent_address} />
                  {p.agent_persona && <span className="text-[10px] text-foreground/20 font-light">{personaLabel(p.agent_persona)}</span>}
                  <span className={`font-medium text-[10px] tracking-[0.06em] ${p.direction === "up" ? "text-foreground" : "text-foreground/30"}`}>{p.direction?.toUpperCase()}</span>
                  <span className="text-foreground font-light">{p.tickets} tix @ {fillPrice?.toFixed(2) ?? "—"}</span>
                  <span className="font-mono text-[10px] text-foreground/40">{formatChips(p.chips_spent)}</span>
                  {p.payout_chips != null && <span className="font-mono text-[10px] text-foreground/40">{formatChips(p.payout_chips)}</span>}
                  {p.was_minority && <span className="text-foreground/30 text-[9px] font-medium tracking-[0.06em]">MINORITY</span>}
                  {p.outcome && <span className={`ml-auto font-medium text-[10px] tracking-[0.06em] ${p.outcome === "correct" ? "text-foreground" : "text-foreground/25"}`}>{p.outcome.toUpperCase()}</span>}
                  <span className="text-foreground/15 text-[10px] font-light">{relativeTime(p.submitted_at)}</span>
                </div>
                {expanded && p.reasoning && (
                  <div className="py-3 pl-6 border-t border-border/20 text-[11px] text-foreground/35 font-light whitespace-pre-wrap leading-relaxed">
                    {p.reasoning}
                  </div>
                )}
              </div>
            );
          })}
          {preds?.pagination?.has_more && (
            <button
              onClick={() => setOffset((o) => o + limit)}
              className="w-full py-2.5 text-[12px] font-light text-foreground border-t border-border/60 hover:bg-foreground/[0.02] transition-colors tracking-[0.04em]"
            >
              Load more
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
