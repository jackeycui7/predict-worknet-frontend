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
                    : "text-foreground/30 font-light hover:text-foreground/60"
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
                    : "text-foreground/30 font-light hover:text-foreground/60"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <select
            value={persona}
            onChange={(e) => resetAndSet(setPersona, e.target.value)}
            className="bg-transparent border border-border px-2.5 py-1.5 text-[11px] font-light text-foreground"
          >
            <option value="">All personas</option>
            {personas?.map((p) => <option key={p.persona} value={p.persona}>{personaLabel(p.persona)}</option>)}
          </select>
        </div>
      </div>

      <div className="border-t border-border/60">
        <table className="w-full">
          <thead>
            <tr className="text-[10px] font-light text-foreground/25 tracking-[0.06em] uppercase">
              <th className="px-4 py-3 text-left w-10">#</th>
              <th className="px-4 py-3 text-left">Agent</th>
              <th className="px-4 py-3 text-left">Persona</th>
              <th className="px-4 py-3 text-right">Excess</th>
              <th className="px-4 py-3 text-right">Acc</th>
              <th className="px-4 py-3 text-right">Earned</th>
              <th className="px-4 py-3 text-right">Streak</th>
              <th className="px-4 py-3 text-right">Chips</th>
              <th className="px-4 py-3 text-right">1h</th>
            </tr>
          </thead>
          <tbody>
            {accumulated.map((e) => (
              <tr key={e.agent_address} className="border-t border-border/40 hover:bg-foreground/[0.02] text-[12px] transition-colors">
                <td className="px-4 py-2.5 text-foreground/15 font-serif-editorial text-[20px]">{e.rank}</td>
                <td className="px-4 py-2.5"><AgentLink address={e.agent_address} /></td>
                <td className="px-4 py-2.5 text-foreground/30 text-[10px] font-light">{personaLabel(e.persona)}</td>
                <td className={`px-4 py-2.5 text-right font-medium ${e.today_excess >= 0 ? "text-foreground" : "text-foreground/40"}`}>{e.today_excess >= 0 ? "+" : ""}{e.today_excess.toFixed(0)}</td>
                <td className="px-4 py-2.5 text-right font-medium">{formatPct(e.accuracy)}</td>
                <td className="px-4 py-2.5 text-right font-medium">{formatPred(e.total_earned)}</td>
                <td className="px-4 py-2.5 text-right font-light">{e.current_streak}</td>
                <td className="px-4 py-2.5 text-right font-mono text-[10px] text-foreground/30">{formatChips(e.today_chips_spent)}</td>
                <td className={`px-4 py-2.5 text-right font-medium ${e.rank_change_1h > 0 ? "text-foreground" : e.rank_change_1h < 0 ? "text-foreground/30" : "text-foreground/15"}`}>{rankChange(e.rank_change_1h)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {lb?.pagination?.has_more && (
        <button
          onClick={() => setOffset((o) => o + limit)}
          className="w-full mt-6 py-2.5 text-[12px] font-light text-foreground border-t border-border/60 hover:bg-foreground/[0.02] transition-colors tracking-[0.04em]"
        >
          Load more
        </button>
      )}

      {personas && personas.length > 0 && (
        <div className="mt-16">
          <span className="section-label">Persona comparison</span>
          <div className="grid grid-cols-2 gap-px bg-border/40 border border-border/40 mt-5">
            {personas.map((p) => (
              <div key={p.persona} className="bg-background p-6">
                <div className="font-serif-editorial text-[20px] text-foreground mb-3">{personaLabel(p.persona)}</div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-[10px] font-light text-foreground/25 tracking-[0.04em] mb-1">Agents</div>
                    <div className="font-serif-editorial text-[24px] text-foreground">{p.agent_count}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-light text-foreground/25 tracking-[0.04em] mb-1">Subs</div>
                    <div className="font-serif-editorial text-[24px] text-foreground">{formatNumber(p.today_submissions)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-light text-foreground/25 tracking-[0.04em] mb-1">Accuracy</div>
                    <div className="font-serif-editorial text-[24px] text-foreground">{formatPct(p.today_accuracy)}</div>
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
