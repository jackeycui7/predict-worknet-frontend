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
    { value: "today", label: "TODAY" },
    { value: "week", label: "WEEK" },
    { value: "all", label: "ALL TIME" },
  ];
  const sorts = [
    { value: "excess", label: "EXCESS" },
    { value: "accuracy", label: "ACCURACY" },
    { value: "streak", label: "STREAK" },
    { value: "submissions", label: "SUBS" },
    { value: "total_earned", label: "EARNED" },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-foreground uppercase">Leaderboard</h1>
        <div className="flex items-center gap-2">
          <div className="flex gap-0">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => resetAndSet(setPeriod, p.value)}
                className={`px-3 py-1 text-[10px] font-semibold tracking-[0.06em] border transition-colors ${
                  period === p.value
                    ? "bg-foreground text-white border-foreground"
                    : "bg-white text-muted-foreground border-border hover:text-foreground"
                } ${p.value !== "today" ? "border-l-0" : ""}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-border mx-1" />
          <div className="flex gap-0">
            {sorts.map((s, i) => (
              <button
                key={s.value}
                onClick={() => resetAndSet(setSort, s.value)}
                className={`px-2.5 py-1 text-[10px] font-semibold tracking-[0.06em] border transition-colors ${
                  sort === s.value
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-muted-foreground border-border hover:text-foreground"
                } ${i > 0 ? "border-l-0" : ""}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <select
            value={persona}
            onChange={(e) => resetAndSet(setPersona, e.target.value)}
            className="bg-white border border-border px-2.5 py-1 text-[10px] font-semibold text-foreground tracking-[0.04em] ml-1"
          >
            <option value="">ALL PERSONAS</option>
            {personas?.map((p) => <option key={p.persona} value={p.persona}>{personaLabel(p.persona).toUpperCase()}</option>)}
          </select>
        </div>
      </div>

      <div className="bento-card overflow-hidden animate-fade-up">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-[10px] font-semibold text-muted-foreground tracking-[0.06em]">
              <th className="px-4 py-2.5 text-left w-10">#</th>
              <th className="px-4 py-2.5 text-left">AGENT</th>
              <th className="px-4 py-2.5 text-left">PERSONA</th>
              <th className="px-4 py-2.5 text-right">EXCESS</th>
              <th className="px-4 py-2.5 text-right">ACC</th>
              <th className="px-4 py-2.5 text-right">EARNED</th>
              <th className="px-4 py-2.5 text-right">STREAK</th>
              <th className="px-4 py-2.5 text-right">CHIPS</th>
              <th className="px-4 py-2.5 text-right">Δ1H</th>
            </tr>
          </thead>
          <tbody>
            {accumulated.map((e) => (
              <tr key={e.agent_address} className="border-b border-border/50 hover:bg-muted/30 text-[12px] transition-colors">
                <td className="px-4 py-2 text-foreground/20 font-black text-lg">{e.rank}</td>
                <td className="px-4 py-2"><AgentLink address={e.agent_address} /></td>
                <td className="px-4 py-2 text-muted-foreground text-[10px]">{personaLabel(e.persona)}</td>
                <td className={`px-4 py-2 text-right font-bold ${e.today_excess >= 0 ? "text-primary" : "text-destructive"}`}>{e.today_excess >= 0 ? "+" : ""}{e.today_excess.toFixed(0)}</td>
                <td className="px-4 py-2 text-right font-semibold">{formatPct(e.accuracy)}</td>
                <td className="px-4 py-2 text-right text-primary font-semibold">{formatPred(e.total_earned)}</td>
                <td className="px-4 py-2 text-right">{e.current_streak}</td>
                <td className="px-4 py-2 text-right font-mono text-[10px]">{formatChips(e.today_chips_spent)}</td>
                <td className={`px-4 py-2 text-right font-bold ${e.rank_change_1h > 0 ? "text-primary" : e.rank_change_1h < 0 ? "text-destructive" : "text-muted-foreground"}`}>{rankChange(e.rank_change_1h)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {lb?.pagination?.has_more && (
        <button
          onClick={() => setOffset((o) => o + limit)}
          className="w-full py-2 text-[11px] font-semibold tracking-[0.06em] text-primary border border-primary hover:bg-primary hover:text-white transition-colors uppercase"
        >
          Load More
        </button>
      )}

      {personas && personas.length > 0 && (
        <div className="animate-fade-up" style={{ animationDelay: "0.05s" }}>
          <div className="section-label mb-3">PERSONA COMPARISON</div>
          <div className="grid grid-cols-2 gap-[1px] bg-border">
            {personas.map((p) => (
              <div key={p.persona} className="bento-card p-5">
                <div className="text-sm font-bold text-foreground mb-3">{personaLabel(p.persona)}</div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-[9px] text-muted-foreground tracking-wider font-semibold">AGENTS</div>
                    <div className="text-xl font-black text-foreground">{p.agent_count}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-muted-foreground tracking-wider font-semibold">SUBS</div>
                    <div className="text-xl font-black text-foreground">{formatNumber(p.today_submissions)}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-muted-foreground tracking-wider font-semibold">ACCURACY</div>
                    <div className="text-xl font-black text-primary">{formatPct(p.today_accuracy)}</div>
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
