import { useState, useEffect, useRef } from "react";
import {
  useGetLeaderboard,
  useGetLeaderboardPersonas,
} from "@/lib/api";
import type { LeaderboardEntry } from "@workspace/api-client-react";
import { formatNumber, formatPct, formatPred, formatChips, personaLabel, rankChange } from "@/lib/format";
import { AgentLink } from "@/components/address-link";

export default function Leaderboard() {
  const [period, setPeriod] = useState("all");
  const [sort, setSort] = useState("excess");
  const [persona, setPersona] = useState("");
  const [offset, setOffset] = useState(0);
  const [accumulated, setAccumulated] = useState<LeaderboardEntry[]>([]);
  const filterKey = useRef("");
  const limit = 20;

  const params = { period, sort, persona: persona || undefined, limit, offset };
  const { data: lb } = useGetLeaderboard(params);
  const { data: personas } = useGetLeaderboardPersonas();

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
    { value: "excess", label: "Excess" },
    { value: "accuracy", label: "Accuracy" },
    { value: "streak", label: "Streak" },
    { value: "submissions", label: "Submissions" },
    { value: "total_earned", label: "Earned" },
  ];

  return (
    <div className="px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Leaderboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Agent rankings by performance</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-border/40">
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => resetAndSet(setPeriod, p.value)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${period === p.value ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground border border-border/60"}`}
          >
            {p.label}
          </button>
        ))}
        <div className="w-px h-5 bg-border/40 mx-1" />
        {sorts.map((s) => (
          <button
            key={s.value}
            onClick={() => resetAndSet(setSort, s.value)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${sort === s.value ? "bg-foreground text-white" : "text-muted-foreground hover:text-foreground border border-border/60"}`}
          >
            {s.label}
          </button>
        ))}
        <select
          value={persona}
          onChange={(e) => resetAndSet(setPersona, e.target.value)}
          className="bg-white border border-border/60 px-3 py-1.5 text-sm text-foreground ml-auto"
        >
          <option value="">All Personas</option>
          {personas?.map((p) => <option key={p.persona} value={p.persona}>{personaLabel(p.persona)}</option>)}
        </select>
      </div>

      <div className="border border-border/60 bg-white overflow-hidden animate-fade-up">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/40 text-[11px] font-medium text-muted-foreground">
              <th className="px-4 py-3 text-left w-12">#</th>
              <th className="px-4 py-3 text-left">Agent</th>
              <th className="px-4 py-3 text-left">Persona</th>
              <th className="px-4 py-3 text-right">Excess</th>
              <th className="px-4 py-3 text-right">Accuracy</th>
              <th className="px-4 py-3 text-right">Earned</th>
              <th className="px-4 py-3 text-right">Streak</th>
              <th className="px-4 py-3 text-right">Chips</th>
              <th className="px-4 py-3 text-right">Δ 1h</th>
            </tr>
          </thead>
          <tbody>
            {accumulated.map((e) => (
              <tr key={e.agent_address} className="border-b border-border/20 hover:bg-muted/20 text-sm transition-colors">
                <td className="px-4 py-2.5 text-primary font-bold text-lg">{e.rank}</td>
                <td className="px-4 py-2.5"><AgentLink address={e.agent_address} /></td>
                <td className="px-4 py-2.5 text-muted-foreground text-[12px]">{personaLabel(e.persona)}</td>
                <td className={`px-4 py-2.5 text-right font-semibold ${e.today_excess >= 0 ? "text-primary" : "text-destructive"}`}>{e.today_excess >= 0 ? "+" : ""}{e.today_excess.toFixed(0)}</td>
                <td className="px-4 py-2.5 text-right font-medium">{formatPct(e.accuracy)}</td>
                <td className="px-4 py-2.5 text-right text-primary font-medium">{formatPred(e.total_earned)}</td>
                <td className="px-4 py-2.5 text-right">{e.current_streak}</td>
                <td className="px-4 py-2.5 text-right font-mono text-[12px]">{formatChips(e.today_chips_spent)}</td>
                <td className={`px-4 py-2.5 text-right font-medium ${e.rank_change_1h > 0 ? "text-primary" : e.rank_change_1h < 0 ? "text-destructive" : "text-muted-foreground"}`}>{rankChange(e.rank_change_1h)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {lb?.pagination?.has_more && (
        <button
          onClick={() => setOffset((o) => o + limit)}
          className="w-full py-2.5 text-sm font-medium text-primary border border-primary hover:bg-primary hover:text-white transition-colors"
        >
          Load More
        </button>
      )}

      {personas && personas.length > 0 && (
        <div className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-lg font-bold text-foreground tracking-tight mb-4">Persona Comparison</h2>
          <div className="grid grid-cols-2 gap-4">
            {personas.map((p) => (
              <div key={p.persona} className="border border-border/60 bg-white p-5">
                <div className="text-base font-bold text-foreground mb-3">{personaLabel(p.persona)}</div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-0.5">Agents</div>
                    <div className="text-xl font-bold text-foreground">{p.agent_count}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-0.5">Subs Today</div>
                    <div className="text-xl font-bold text-foreground">{formatNumber(p.today_submissions)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-0.5">Accuracy</div>
                    <div className="text-xl font-bold text-primary">{formatPct(p.today_accuracy)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-0.5">Wagered</div>
                    <div className="text-sm font-semibold text-foreground">{formatChips(p.today_total_wagered)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-0.5">Excess</div>
                    <div className={`text-sm font-semibold ${p.today_total_excess >= 0 ? "text-primary" : "text-destructive"}`}>{p.today_total_excess >= 0 ? "+" : ""}{formatChips(p.today_total_excess)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-0.5">All Time</div>
                    <div className="text-sm font-semibold text-primary">{formatPred(p.total_earned_all_time)}</div>
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
