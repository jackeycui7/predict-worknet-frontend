import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import {
  useGetMarketById,
  useGetMarketAmmHistory,
  useGetMarketPredictions,
  getGetMarketByIdQueryKey,
  getGetMarketAmmHistoryQueryKey,
  getGetMarketPredictionsQueryKey,
} from "@workspace/api-client-react";
import type { PredictionItem } from "@workspace/api-client-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatPct, formatPrice, formatMultiplier, relativeTime, countdownStr, personaLabel } from "@/lib/format";
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

  const { data: market } = useGetMarketById(id, {
    query: { enabled: !!id, queryKey: getGetMarketByIdQueryKey(id), refetchInterval: 10000 },
  });
  const { data: ammHistory } = useGetMarketAmmHistory(id, {
    query: { enabled: !!id, queryKey: getGetMarketAmmHistoryQueryKey(id), refetchInterval: 10000 },
  });
  const { data: preds } = useGetMarketPredictions(
    id,
    { limit, offset, outcome: outcomeFilter || undefined },
    { query: { enabled: !!id, queryKey: getGetMarketPredictionsQueryKey(id, { limit, offset, outcome: outcomeFilter || undefined }) } }
  );

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

  const chartData = ammHistory?.map((p) => ({
    time: new Date(p.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    up: p.up_price,
    down: p.down_price,
  })) ?? [];

  if (!market) {
    return (
      <div className="p-6 font-mono text-muted-foreground" data-testid="market-detail-loading">Loading market...</div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="market-detail-page">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-xl font-mono font-bold text-foreground">{market.asset}</h1>
          <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted">{market.window}</span>
          <span className={`text-xs font-mono px-2 py-0.5 rounded ${market.status === "open" ? "bg-primary/20 text-primary" : market.status === "resolved" ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"}`}>
            {market.status.toUpperCase()}
          </span>
          {market.status === "open" && <span className="text-sm font-mono text-primary">{countdown}</span>}
        </div>
        <div className="text-sm font-mono text-muted-foreground">{market.question}</div>
        <div className="text-xs font-mono text-muted-foreground mt-1">{market.id}</div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border border-border rounded p-4 bg-card">
          <div className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Market Info</div>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between"><span className="text-muted-foreground">Open Price</span><span>{formatPrice(market.open_price)}</span></div>
            {market.resolve_price != null && <div className="flex justify-between"><span className="text-muted-foreground">Close Price</span><span>{formatPrice(market.resolve_price)}</span></div>}
            {market.outcome && <div className="flex justify-between"><span className="text-muted-foreground">Outcome</span><span className={market.outcome === "up" ? "text-primary font-bold" : "text-destructive font-bold"}>{market.outcome.toUpperCase()}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Total Predictions</span><span>{market.stats.total_predictions}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Up/Down</span><span>{market.stats.up_count}/{market.stats.down_count}</span></div>
          </div>
        </div>
        <div className="border border-border rounded p-4 bg-card">
          <div className="text-[10px] font-mono text-muted-foreground uppercase mb-2">AMM State</div>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between"><span className="text-primary">UP Price</span><span>{formatPct(market.amm.up_price)}</span></div>
            <div className="flex justify-between"><span className="text-destructive">DOWN Price</span><span>{formatPct(market.amm.down_price)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">UP Reserve</span><span>{market.amm.up_reserve.toFixed(1)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">DOWN Reserve</span><span>{market.amm.down_reserve.toFixed(1)}</span></div>
          </div>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="border border-border rounded p-4 bg-card" data-testid="amm-chart">
          <div className="text-[10px] font-mono text-muted-foreground uppercase mb-3">AMM Price History</div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240,10%,15%)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(120,20%,60%)" }} />
              <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: "hsl(120,20%,60%)" }} />
              <Tooltip contentStyle={{ background: "hsl(240,10%,6%)", border: "1px solid hsl(240,10%,15%)", color: "hsl(120,100%,90%)", fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="up" name="UP" stroke="hsl(150,100%,40%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="down" name="DOWN" stroke="hsl(0,100%,45%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">Predictions</h2>
          <select
            value={outcomeFilter}
            onChange={(e) => { setOutcomeFilter(e.target.value); setOffset(0); setAccumulated([]); }}
            className="bg-card border border-border rounded px-2 py-1 text-xs font-mono text-foreground"
            data-testid="filter-outcome"
          >
            <option value="">All</option>
            <option value="correct">Correct</option>
            <option value="incorrect">Incorrect</option>
          </select>
        </div>
        <div className="space-y-1" data-testid="predictions-list">
          {accumulated.map((p, i) => {
            const expanded = expandedIdx.has(i);
            return (
              <div key={`${p.agent_address}-${p.submitted_at}`} className="border border-border rounded bg-card">
                <div
                  className="px-4 py-2 flex items-center gap-3 text-xs font-mono cursor-pointer hover:bg-muted/30"
                  onClick={() => setExpandedIdx((prev) => { const next = new Set(prev); expanded ? next.delete(i) : next.add(i); return next; })}
                  data-testid={`prediction-${i}`}
                >
                  <span className="text-muted-foreground w-6">#{p.position_in_market}</span>
                  <AgentLink address={p.agent_address} />
                  <span className="text-muted-foreground">{personaLabel(p.agent_persona)}</span>
                  <span className={p.direction === "up" ? "text-primary font-bold" : "text-destructive font-bold"}>{p.direction.toUpperCase()}</span>
                  <span className="text-accent">{formatMultiplier(p.locked_multiplier)}</span>
                  {p.outcome && <span className={`ml-auto ${p.outcome === "correct" ? "text-primary" : "text-destructive"}`}>{p.outcome.toUpperCase()}</span>}
                  <span className="text-muted-foreground">{relativeTime(p.submitted_at)}</span>
                  <span className="text-muted-foreground">{expanded ? "[-]" : "[+]"}</span>
                </div>
                {expanded && (
                  <div className="px-4 py-3 border-t border-border/50 text-xs font-mono text-muted-foreground whitespace-pre-wrap">
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
            className="w-full mt-3 py-2 text-xs font-mono text-primary border border-border rounded hover:bg-muted/50"
            data-testid="load-more-predictions"
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );
}
