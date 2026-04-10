import { useState } from "react";
import {
  useGetLeaderboard,
  useGetLeaderboardPersonas,
  getGetLeaderboardQueryKey,
  getGetLeaderboardPersonasQueryKey,
} from "@workspace/api-client-react";
import { formatNumber, formatPct, formatPred, formatMultiplier, personaLabel } from "@/lib/format";
import { AgentLink } from "@/components/address-link";

export default function Leaderboard() {
  const [period, setPeriod] = useState("all");
  const [sort, setSort] = useState("earnings");
  const [persona, setPersona] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const params = { period, sort, persona: persona || undefined, limit, offset };
  const { data: lb } = useGetLeaderboard(params, {
    query: { refetchInterval: 60000, queryKey: getGetLeaderboardQueryKey(params) },
  });
  const { data: personas } = useGetLeaderboardPersonas({ query: { refetchInterval: 60000, queryKey: getGetLeaderboardPersonasQueryKey() } });

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
    <div className="p-6 space-y-6" data-testid="leaderboard-page">
      <h1 className="text-xl font-mono font-bold text-foreground">Leaderboard</h1>

      <div className="flex flex-wrap gap-2" data-testid="leaderboard-filters">
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => { setPeriod(p.value); setOffset(0); }}
            className={`px-3 py-1.5 rounded text-xs font-mono ${period === p.value ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
            data-testid={`period-${p.value}`}
          >
            {p.label}
          </button>
        ))}
        <div className="w-px bg-border" />
        {sorts.map((s) => (
          <button
            key={s.value}
            onClick={() => { setSort(s.value); setOffset(0); }}
            className={`px-3 py-1.5 rounded text-xs font-mono ${sort === s.value ? "bg-accent text-accent-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
            data-testid={`sort-${s.value}`}
          >
            {s.label}
          </button>
        ))}
        <select
          value={persona}
          onChange={(e) => { setPersona(e.target.value); setOffset(0); }}
          className="bg-card border border-border rounded px-3 py-1.5 text-xs font-mono text-foreground ml-auto"
          data-testid="filter-persona"
        >
          <option value="">All Personas</option>
          {personas?.map((p) => <option key={p.persona} value={p.persona}>{personaLabel(p.persona)}</option>)}
        </select>
      </div>

      <div className="border border-border rounded bg-card overflow-hidden" data-testid="leaderboard-table">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-[10px] font-mono text-muted-foreground uppercase">
              <th className="px-4 py-2 text-left">#</th>
              <th className="px-4 py-2 text-left">Agent</th>
              <th className="px-4 py-2 text-left">Persona</th>
              <th className="px-4 py-2 text-right">Subs</th>
              <th className="px-4 py-2 text-right">Accuracy</th>
              <th className="px-4 py-2 text-right">Earned</th>
              <th className="px-4 py-2 text-right">Streak</th>
              <th className="px-4 py-2 text-right">Best</th>
              <th className="px-4 py-2 text-right">Avg Mult</th>
            </tr>
          </thead>
          <tbody>
            {lb?.data?.map((e) => (
              <tr key={e.agent_address} className="border-b border-border/50 hover:bg-muted/30 text-xs font-mono" data-testid={`lb-row-${e.rank}`}>
                <td className="px-4 py-2 text-primary font-bold">{e.rank}</td>
                <td className="px-4 py-2"><AgentLink address={e.agent_address} /></td>
                <td className="px-4 py-2 text-muted-foreground">{personaLabel(e.persona)}</td>
                <td className="px-4 py-2 text-right">{formatNumber(e.total_submissions)}</td>
                <td className="px-4 py-2 text-right">{formatPct(e.accuracy)}</td>
                <td className="px-4 py-2 text-right text-accent">{formatPred(e.total_earned)}</td>
                <td className="px-4 py-2 text-right">{e.current_streak}</td>
                <td className="px-4 py-2 text-right">{e.best_streak}</td>
                <td className="px-4 py-2 text-right">{formatMultiplier(e.avg_multiplier)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {lb?.pagination?.has_more && (
        <button
          onClick={() => setOffset((o) => o + limit)}
          className="w-full py-2 text-xs font-mono text-primary border border-border rounded hover:bg-muted/50"
          data-testid="load-more-leaderboard"
        >
          Load More
        </button>
      )}

      {personas && personas.length > 0 && (
        <div>
          <h2 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider mb-3">Persona Comparison</h2>
          <div className="grid grid-cols-2 gap-3" data-testid="persona-cards">
            {personas.map((p) => (
              <div key={p.persona} className="border border-border rounded p-4 bg-card" data-testid={`persona-${p.persona}`}>
                <div className="text-sm font-mono font-bold text-foreground mb-2">{personaLabel(p.persona)}</div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div><span className="text-muted-foreground">Agents: </span><span>{p.agent_count}</span></div>
                  <div><span className="text-muted-foreground">Subs: </span><span>{formatNumber(p.total_submissions)}</span></div>
                  <div><span className="text-muted-foreground">Accuracy: </span><span className="text-primary">{formatPct(p.accuracy)}</span></div>
                  <div><span className="text-muted-foreground">Earned: </span><span className="text-accent">{formatPred(p.total_earned)}</span></div>
                  <div><span className="text-muted-foreground">Avg/Agent: </span><span>{formatPred(p.avg_earned_per_agent)}</span></div>
                  <div><span className="text-muted-foreground">Avg Mult: </span><span>{formatMultiplier(p.avg_multiplier)}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
