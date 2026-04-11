import { useState, useEffect, useRef } from "react";
import {
  useGetLeaderboard,
  useGetLeaderboardEquityCurves,
} from "@/lib/api";
import type { LeaderboardEntry } from "@workspace/api-client-react";
import { formatPct, formatPred, formatChips, rankChange } from "@/lib/format";
import { AgentLink } from "@/components/address-link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";

// Colors for different agent lines
const AGENT_COLORS = [
  "hsl(var(--primary))",
  "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#6366f1"
];

export default function Leaderboard() {
  const [period, setPeriod] = useState("all");
  const [sort, setSort] = useState("excess");
  const [offset, setOffset] = useState(0);
  const [accumulated, setAccumulated] = useState<LeaderboardEntry[]>([]);
  const [showChart, setShowChart] = useState(true);
  const filterKey = useRef("");
  const limit = 20;

  const params = { period, sort, limit, offset };
  const { data: lb } = useGetLeaderboard(params);
  const { data: equityCurves } = useGetLeaderboardEquityCurves({ limit: 5 });

  const currentFilterKey = `${period}-${sort}`;
  useEffect(() => {
    if (currentFilterKey !== filterKey.current) {
      filterKey.current = currentFilterKey;
      setAccumulated([]);
      setOffset(0);
    }
  }, [currentFilterKey]);

  useEffect(() => {
    if (lb?.data) {
      if (offset === 0) {
        setAccumulated(lb.data);
      } else {
        setAccumulated((prev) => {
          const existingAddrs = new Set(prev.map((e) => e.agent_address));
          const newItems = lb.data.filter((e) => !existingAddrs.has(e.agent_address));
          return [...prev, ...newItems];
        });
      }
    }
  }, [lb?.data, offset]);

  const resetAndSet = (setter: (v: string) => void, value: string) => {
    setter(value);
    setOffset(0);
    setAccumulated([]);
  };

  const periods = [
    { value: "today", label: "Today" },
    { value: "week", label: "Week" },
    { value: "all", label: "All time" },
  ];
  const sorts = [
    { value: "excess", label: "Excess" },
    { value: "accuracy", label: "Accuracy" },
    { value: "streak", label: "Streak" },
    { value: "submissions", label: "Subs" },
    { value: "total_earned", label: "Earned" },
  ];

  return (
    <div className="animate-fade-up">
      <div className="flex items-baseline justify-between mb-10">
        <h1 className="font-serif-editorial text-[48px] tracking-[-0.03em] text-foreground leading-[1]">Leaderboard</h1>
        <div className="flex items-center gap-4">
          <div className="flex gap-0">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => resetAndSet(setPeriod, p.value)}
                className={`px-4 py-1.5 text-[12px] tracking-[0.02em] transition-colors ${
                  period === p.value
                    ? "text-foreground font-medium border-b-2 border-foreground"
                    : "text-foreground/40 hover:text-foreground/70"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <span className="text-foreground/10">|</span>
          <div className="flex gap-0">
            {sorts.map((s) => (
              <button
                key={s.value}
                onClick={() => resetAndSet(setSort, s.value)}
                className={`px-3 py-1.5 text-[11px] tracking-[0.02em] transition-colors ${
                  sort === s.value
                    ? "text-foreground font-medium border-b-2 border-foreground"
                    : "text-foreground/40 hover:text-foreground/70"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowChart(!showChart)}
            className="px-3 py-1.5 text-[11px] tracking-[0.02em] text-foreground/40 hover:text-foreground/70 transition-colors border border-border/40"
          >
            {showChart ? "Hide" : "Show"} Chart
          </button>
        </div>
      </div>

      {/* Multi-agent Equity Curves Chart */}
      {showChart && equityCurves && equityCurves.length > 0 && (() => {
        // Transform data to handle string/number formats
        const transformedCurves = equityCurves.map((curve: any) => ({
          ...curve,
          points: curve.points?.map((p: any) => ({
            ...p,
            timestamp: typeof p.timestamp === "number" ? p.timestamp * 1000 : p.timestamp,
            cumulative_pnl: typeof p.cumulative_pnl === "string" ? parseFloat(p.cumulative_pnl) : p.cumulative_pnl,
          })) ?? [],
        }));
        return (
          <div className="mb-10">
            <div className="border border-border/40 bg-background p-4">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis
                    dataKey="timestamp"
                    type="category"
                    allowDuplicatedCategory={false}
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
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeOpacity={0.2} />
                  <Legend
                    wrapperStyle={{ fontSize: 10 }}
                    formatter={(value) => value.slice(0, 8) + "..."}
                  />
                  {transformedCurves.map((curve: any, idx: number) => (
                    <Line
                      key={curve.agent_address}
                      data={curve.points}
                      type="monotone"
                      dataKey="cumulative_pnl"
                      name={curve.agent_address}
                      stroke={AGENT_COLORS[idx % AGENT_COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })()}

      <div className="border-t border-border/60">
        <table className="w-full">
          <thead>
            <tr className="text-[11px] font-medium text-foreground/50 tracking-[0.04em] uppercase">
              <th className="px-5 py-3 text-left w-16">#</th>
              <th className="px-5 py-3 text-left">Agent</th>
              <th className="px-5 py-3 text-right">Payout</th>
              <th className="px-5 py-3 text-right">Accuracy</th>
              <th className="px-5 py-3 text-right">Preds</th>
              <th className="px-5 py-3 text-right">W/L</th>
              <th className="px-5 py-3 text-right">Persona</th>
              <th className="px-5 py-3 text-right w-16">Δ1h</th>
            </tr>
          </thead>
          <tbody>
            {accumulated.map((e: any) => (
              <tr key={e.agent_address} className="border-t border-border/40 hover:bg-foreground/[0.02] text-[13px] transition-colors">
                <td className="px-5 py-3 text-foreground/30 font-serif-editorial text-[20px]">{e.rank}</td>
                <td className="px-5 py-3"><AgentLink address={e.agent_address} /></td>
                <td className="px-5 py-3 text-right font-semibold text-foreground">{formatChips(e.total_payout_chips)}</td>
                <td className="px-5 py-3 text-right font-semibold text-foreground">{formatPct(e.accuracy)}</td>
                <td className="px-5 py-3 text-right font-semibold text-foreground">{e.total_predictions}</td>
                <td className="px-5 py-3 text-right text-foreground">{e.wins}/{e.losses}</td>
                <td className="px-5 py-3 text-right font-mono text-[11px] text-foreground/50">{e.persona ?? "—"}</td>
                <td className="px-5 py-3 text-right font-semibold text-foreground/20">—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {lb?.pagination?.has_more && (
        <button
          onClick={() => setOffset((o) => o + limit)}
          className="w-full mt-6 py-2.5 text-[12px] text-primary border-t border-border/60 hover:bg-primary/[0.03] transition-colors tracking-[0.04em]"
        >
          Load more
        </button>
      )}
    </div>
  );
}
