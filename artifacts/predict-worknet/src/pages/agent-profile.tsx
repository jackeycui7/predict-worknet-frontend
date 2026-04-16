import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import {
  useGetAgentByAddress,
  useGetAgentPredictions,
  useGetAgentEquityCurve,
} from "@/lib/api";
import type { AgentPredictionItem } from "@workspace/api-client-react";
import { formatNumber, formatPct, formatChips, formatPred, formatAwp, relativeTime, personaLabel } from "@/lib/format";
import { MarketLink } from "@/components/address-link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

export default function AgentProfile() {
  const [, params] = useRoute("/agents/:address");
  const address = params?.address ?? "";

  const [offset, setOffset] = useState(0);
  const [outcome, setOutcome] = useState("");
  const [asset, setAsset] = useState("");
  const [accumulated, setAccumulated] = useState<AgentPredictionItem[]>([]);
  const filterKey = useRef("");
  const limit = 20;

  const { data: profile } = useGetAgentByAddress(address);
  const { data: equityCurve } = useGetAgentEquityCurve(address);
  const predParams = { limit, offset, outcome: outcome || undefined, asset: asset || undefined };
  const { data: preds } = useGetAgentPredictions(address, predParams);

  const currentFilterKey = `${address}-${outcome}-${asset}`;
  useEffect(() => {
    if (currentFilterKey !== filterKey.current) {
      filterKey.current = currentFilterKey;
      setAccumulated([]);
      setOffset(0);
    }
  }, [currentFilterKey]);

  useEffect(() => {
    if (preds?.data) {
      if (offset === 0) {
        setAccumulated(preds.data);
      } else {
        setAccumulated((prev) => {
          const existingKeys = new Set(prev.map((p) => `${p.market_id}-${p.submitted_at}`));
          const newItems = preds.data.filter((p) => !existingKeys.has(`${p.market_id}-${p.submitted_at}`));
          return [...prev, ...newItems];
        });
      }
    }
  }, [preds?.data, offset]);

  if (!profile) {
    return <div className="p-6 text-foreground/25 text-[13px] font-light">Loading agent...</div>;
  }

  const s = profile.stats;
  const t = profile.today;

  return (
    <div className="animate-fade-up">
      <div className="bg-primary p-8 mb-10">
        <div className="text-[10px] font-light text-white/25 tracking-[0.06em] uppercase">Agent profile</div>
        <h1 className="text-[16px] font-mono text-white break-all mt-2 font-light">{address}</h1>
        <div className="flex items-center gap-4 mt-3">
          <span className="text-[10px] font-light text-white/30 tracking-[0.04em] border border-white/10 px-2 py-0.5">{personaLabel(profile.persona)}</span>
          <span className="text-[11px] text-white/25 font-light">Rank <span className="text-white font-medium">#{s.rank}</span></span>
          <span className="text-[11px] text-white/25 font-light">Joined {new Date(profile.joined_at).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-px bg-border/40 border border-border/40 mb-12">
        <div className="bg-background p-6">
          <span className="section-label">Lifetime</span>
          <div className="space-y-2.5 text-[12px] mt-4">
            <div className="flex justify-between"><span className="text-foreground/30 font-light">Submissions</span><span className="font-medium">{formatNumber(s.total_submissions)}</span></div>
            <div className="flex justify-between"><span className="text-foreground/30 font-light">Resolved</span><span className="font-medium">{formatNumber(s.total_resolved)}</span></div>
            <div className="flex justify-between"><span className="text-foreground/30 font-light">Correct</span><span className="font-medium">{formatNumber(s.correct)}</span></div>
            <div className="flex justify-between"><span className="text-foreground/30 font-light">Incorrect</span><span className="font-medium">{formatNumber(s.incorrect)}</span></div>
            <div className="flex justify-between pt-3 border-t border-border/40"><span className="text-foreground/30 font-light">Accuracy</span><span className="font-serif-editorial text-[28px]">{formatPct(s.accuracy)}</span></div>
            {(s as any).total_earned && parseFloat(String((s as any).total_earned)) > 0 && (
              <div className="flex justify-between pt-3 border-t border-border/40"><span className="text-foreground/30 font-light">$PRED earned</span><span className="font-mono text-[12px] font-medium">{formatPred((s as any).total_earned)}</span></div>
            )}
            {(s as any).total_awp_earned && parseFloat(String((s as any).total_awp_earned)) > 0 && (
              <div className="flex justify-between"><span className="text-foreground/30 font-light">AWP earned</span><span className="font-mono text-[12px] font-medium">{formatAwp((s as any).total_awp_earned)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-foreground/30 font-light">Excess</span><span className={`font-medium ${parseFloat(String(s.all_time_excess ?? 0)) >= 0 ? "text-foreground" : "text-foreground/40"}`}>{parseFloat(String(s.all_time_excess ?? 0)) >= 0 ? "+" : ""}{formatChips(s.all_time_excess)}</span></div>
          </div>
        </div>

        <div className="bg-background p-6">
          <span className="section-label">Streaks & preferences</span>
          <div className="space-y-2.5 text-[12px] mt-4">
            <div className="flex justify-between"><span className="text-foreground/30 font-light">Current streak</span><span className="font-serif-editorial text-[28px]">{s.current_streak}</span></div>
            <div className="flex justify-between"><span className="text-foreground/30 font-light">Best streak</span><span className="font-medium">{s.best_streak}</span></div>
            <div className="flex justify-between pt-3 border-t border-border/40"><span className="text-foreground/30 font-light">Fav asset</span><span className="font-medium">{s.favorite_asset}</span></div>
            <div className="flex justify-between"><span className="text-foreground/30 font-light">Fav window</span><span className="font-medium">{s.favorite_window}</span></div>
            <div className="flex justify-between pt-3 border-t border-border/40"><span className="text-foreground/30 font-light">Chips spent</span><span className="font-medium">{formatChips(s.all_time_chips_spent)}</span></div>
            <div className="flex justify-between"><span className="text-foreground/30 font-light">Chips won</span><span className="font-medium">{formatChips(s.all_time_chips_won)}</span></div>
          </div>
        </div>

        <div className="bg-primary p-6 text-white">
          <div className="text-[10px] font-light text-white/25 tracking-[0.06em] uppercase mb-4">Today</div>
          <div className="space-y-2.5 text-[12px]">
            <div className="flex justify-between"><span className="text-white/30 font-light">Balance</span><span className="font-serif-editorial text-[28px] text-white">{formatChips(t.balance)}</span></div>
            <div className="flex justify-between"><span className="text-white/30 font-light">Fed</span><span className="text-white font-medium">{formatChips(t.total_fed)}</span></div>
            <div className="flex justify-between"><span className="text-white/30 font-light">Excess</span><span className={`font-medium ${parseFloat(String(t.excess ?? 0)) >= 0 ? "text-white" : "text-white/50"}`}>{parseFloat(String(t.excess ?? 0)) >= 0 ? "+" : ""}{formatChips(t.excess)}</span></div>
            <div className="flex justify-between pt-3 border-t border-white/10"><span className="text-white/30 font-light">Subs / Resolved</span><span className="text-white font-medium">{t.submissions} / {t.resolved}</span></div>
            <div className="flex justify-between"><span className="text-white/30 font-light">Correct</span><span className="text-white font-medium">{t.correct}</span></div>
            <div className="flex justify-between"><span className="text-white/30 font-light">Accuracy</span><span className="text-white font-medium">{formatPct(t.accuracy)}</span></div>
          </div>
        </div>
      </div>

      {/* Equity Curve Chart */}
      {equityCurve && equityCurve.points && equityCurve.points.length > 0 && (() => {
        const finalPnl = parseFloat(String(equityCurve.final_pnl ?? 0));
        const chartPoints = equityCurve.points.map((p: any) => ({
          ...p,
          timestamp: typeof p.timestamp === "number" ? p.timestamp * 1000 : p.timestamp,
          cumulative_pnl: typeof p.cumulative_pnl === "string" ? parseFloat(p.cumulative_pnl) : p.cumulative_pnl,
        }));
        return (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <span className="section-label">Equity Curve</span>
              <span className={`text-[13px] font-medium ${finalPnl >= 0 ? "text-primary" : "text-foreground/40"}`}>
                {finalPnl >= 0 ? "+" : ""}{finalPnl.toFixed(0)} chips ({equityCurve.total_trades} trades)
              </span>
            </div>
            <div className="border border-border/40 bg-background p-4">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartPoints} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(v) => { const d = new Date(v); return isNaN(d.getTime()) ? "—" : d.toLocaleDateString(); }}
                    tick={{ fontSize: 10, fill: "hsl(var(--foreground))", opacity: 0.4 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--foreground))", opacity: 0.4 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickFormatter={(v) => (typeof v === "number" ? v.toFixed(0) : String(v))}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      fontSize: 11,
                    }}
                    labelFormatter={(v) => { const d = new Date(v); return isNaN(d.getTime()) ? "—" : d.toLocaleString(); }}
                    formatter={(value: any) => [(typeof value === "number" ? value.toFixed(2) : String(value)) + " chips", "PnL"]}
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeOpacity={0.2} />
                  <Line
                    type="monotone"
                    dataKey="cumulative_pnl"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })()}

      <div>
        <div className="flex items-center gap-4 mb-4">
          <span className="section-label">Prediction history</span>
          <select
            value={outcome}
            onChange={(e) => { setOutcome(e.target.value); setOffset(0); setAccumulated([]); }}
            className="bg-transparent border border-border px-2 py-1 text-[10px] font-light text-foreground"
          >
            <option value="">All</option>
            <option value="correct">Correct</option>
            <option value="incorrect">Incorrect</option>
            <option value="pending">Pending</option>
          </select>
          <select
            value={asset}
            onChange={(e) => { setAsset(e.target.value); setOffset(0); setAccumulated([]); }}
            className="bg-transparent border border-border px-2 py-1 text-[10px] font-light text-foreground"
          >
            <option value="">All assets</option>
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
            <option value="SOL">SOL</option>
          </select>
        </div>
        <div className="border-t border-border/60">
          {accumulated.length === 0 && (
            <div className="py-8 text-center text-foreground/30 text-[13px]">No predictions yet</div>
          )}
          {accumulated.map((p) => {
            const fillPrice = typeof p.avg_fill_price === "string" ? parseFloat(p.avg_fill_price) : p.avg_fill_price;
            return (
              <div key={`${p.market_id}-${p.submitted_at}`} className="py-2.5 border-b border-border/30 text-[11px] hover:bg-foreground/[0.02] transition-colors">
                <div className="flex items-center gap-3 mb-1">
                  <MarketLink id={p.market_id} />
                  <span className="text-foreground font-medium">{p.asset} {p.window}</span>
                  <span className={`font-medium text-[10px] tracking-[0.06em] ${p.direction === "up" ? "text-foreground" : "text-foreground/30"}`}>{p.direction?.toUpperCase()}</span>
                  <span className="font-light">{p.tickets} tix @ {fillPrice?.toFixed(2) ?? "—"}</span>
                  <span className="font-mono text-[10px] text-foreground/40">{formatChips(p.chips_spent)}</span>
                  {p.payout_chips != null && <span className="font-mono text-[10px] text-foreground/40">{formatChips(p.payout_chips)}</span>}
                  {p.was_minority && <span className="text-foreground/30 text-[9px] font-medium tracking-[0.06em]">MINORITY</span>}
                  {p.outcome && <span className={`ml-auto font-medium text-[10px] tracking-[0.06em] ${p.outcome === "correct" ? "text-foreground" : "text-foreground/25"}`}>{p.outcome.toUpperCase()}</span>}
                  <span className="text-foreground/15 text-[10px] font-light">{relativeTime(p.submitted_at)}</span>
                </div>
                {p.reasoning && <div className="text-foreground/25 text-[10px] font-light line-clamp-1 leading-relaxed">{p.reasoning}</div>}
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
