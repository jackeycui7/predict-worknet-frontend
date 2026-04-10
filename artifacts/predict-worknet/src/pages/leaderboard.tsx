import { useState, useEffect, useRef } from "react";
import {
  useGetLeaderboard,
  useGetLeaderboardPersonas,
  getGetLeaderboardQueryKey,
  getGetLeaderboardPersonasQueryKey,
} from "@workspace/api-client-react";
import type { LeaderboardEntry } from "@workspace/api-client-react";
import { formatNumber, formatPct, formatPred, formatMultiplier, personaLabel } from "@/lib/format";
import { AgentLink } from "@/components/address-link";

export default function Leaderboard() {
  const [period, setPeriod] = useState("all");
  const [sort, setSort] = useState("earnings");
  const [persona, setPersona] = useState("");
  const [offset, setOffset] = useState(0);
  const [accumulated, setAccumulated] = useState<LeaderboardEntry[]>([]);
  const filterKey = useRef("");
  const limit = 20;

  const params = { period, sort, persona: persona || undefined, limit, offset };
  const { data: lb } = useGetLeaderboard(params, {
    query: { refetchInterval: 60000, queryKey: getGetLeaderboardQueryKey(params) },
  });
  const { data: personas } = useGetLeaderboardPersonas({ query: { refetchInterval: 60000, queryKey: getGetLeaderboardPersonasQueryKey() } });

  const currentFilterKey = `${period}-${sort}-${persona}`;
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
    { value: "all", label: "All Time" },
  ];
  const sorts = [
    { value: "earnings", label: "Earnings" },
    { value: "accuracy", label: "Accuracy" },
    { value: "streak", label: "Streak" },
    { value: "submissions", label: "Submissions" },
  ];

  return (
    <div className="px-6 py-8 space-y-8" data-testid="leaderboard-page">
      <h1 className="text-4xl font-bold text-primary tracking-tight">Leaderboard.</h1>

      <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4" data-testid="leaderboard-filters">
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => resetAndSet(setPeriod, p.value)}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-widest transition-colors ${period === p.value ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground"}`}
            data-testid={`period-${p.value}`}
          >
            {p.label}
          </button>
        ))}
        <div className="w-px h-5 bg-border" />
        {sorts.map((s) => (
          <button
            key={s.value}
            onClick={() => resetAndSet(setSort, s.value)}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-widest transition-colors ${sort === s.value ? "bg-foreground text-background" : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground"}`}
            data-testid={`sort-${s.value}`}
          >
            {s.label}
          </button>
        ))}
        <select
          value={persona}
          onChange={(e) => resetAndSet(setPersona, e.target.value)}
          className="bg-card border border-border px-3 py-1.5 text-xs font-mono text-foreground ml-auto"
          data-testid="filter-persona"
        >
          <option value="">All Personas</option>
          {personas?.map((p) => <option key={p.persona} value={p.persona}>{personaLabel(p.persona)}</option>)}
        </select>
      </div>

      <div className="border border-border bg-card overflow-hidden" data-testid="leaderboard-table">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Agent</th>
              <th className="px-4 py-3 text-left">Persona</th>
              <th className="px-4 py-3 text-right">Subs</th>
              <th className="px-4 py-3 text-right">Accuracy</th>
              <th className="px-4 py-3 text-right">Earned</th>
              <th className="px-4 py-3 text-right">Streak</th>
              <th className="px-4 py-3 text-right">Best</th>
              <th className="px-4 py-3 text-right">Avg Mult</th>
            </tr>
          </thead>
          <tbody>
            {accumulated.map((e) => (
              <tr key={e.agent_address} className="border-b border-border/50 hover:bg-muted/30 text-xs font-mono" data-testid={`lb-row-${e.rank}`}>
                <td className="px-4 py-2.5 text-primary font-bold text-lg">{e.rank}</td>
                <td className="px-4 py-2.5"><AgentLink address={e.agent_address} /></td>
                <td className="px-4 py-2.5 text-muted-foreground">{personaLabel(e.persona)}</td>
                <td className="px-4 py-2.5 text-right font-bold">{formatNumber(e.total_submissions)}</td>
                <td className="px-4 py-2.5 text-right font-bold">{formatPct(e.accuracy)}</td>
                <td className="px-4 py-2.5 text-right text-primary font-bold">{formatPred(e.total_earned)}</td>
                <td className="px-4 py-2.5 text-right">{e.current_streak}</td>
                <td className="px-4 py-2.5 text-right">{e.best_streak}</td>
                <td className="px-4 py-2.5 text-right">{formatMultiplier(e.avg_multiplier)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {lb?.pagination?.has_more && (
        <button
          onClick={() => setOffset((o) => o + limit)}
          className="w-full py-2.5 text-xs font-mono text-primary border border-primary uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-colors"
          data-testid="load-more-leaderboard"
        >
          Load More
        </button>
      )}

      {personas && personas.length > 0 && (
        <div>
          <h2 className="text-sm font-mono font-bold text-foreground uppercase tracking-widest mb-4 pb-2 border-b border-border">Persona Comparison</h2>
          <div className="grid grid-cols-2 gap-4" data-testid="persona-cards">
            {personas.map((p) => (
              <div key={p.persona} className="border border-border bg-card p-5" data-testid={`persona-${p.persona}`}>
                <div className="text-lg font-bold text-foreground mb-3">{personaLabel(p.persona)}</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border-t border-border pt-2">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Agents</div>
                    <div className="text-xl font-bold text-foreground">{p.agent_count}</div>
                  </div>
                  <div className="border-t border-border pt-2">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Subs</div>
                    <div className="text-xl font-bold text-foreground">{formatNumber(p.total_submissions)}</div>
                  </div>
                  <div className="border-t border-border pt-2">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Accuracy</div>
                    <div className="text-xl font-bold text-primary">{formatPct(p.accuracy)}</div>
                  </div>
                  <div className="border-t border-border pt-2">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Earned</div>
                    <div className="text-xl font-bold text-primary">{formatPred(p.total_earned)}</div>
                  </div>
                  <div className="border-t border-border pt-2">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Avg/Agent</div>
                    <div className="text-sm font-bold text-foreground">{formatPred(p.avg_earned_per_agent)}</div>
                  </div>
                  <div className="border-t border-border pt-2">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Avg Mult</div>
                    <div className="text-sm font-bold text-foreground">{formatMultiplier(p.avg_multiplier)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
