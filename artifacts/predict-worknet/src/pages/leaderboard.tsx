import { useState, useEffect, useRef } from "react";
import {
  useGetLeaderboard,
} from "@/lib/api";
import type { LeaderboardEntry } from "@workspace/api-client-react";
import { formatPct, formatPred, formatChips, rankChange } from "@/lib/format";
import { AgentLink } from "@/components/address-link";

export default function Leaderboard() {
  const [period, setPeriod] = useState("all");
  const [sort, setSort] = useState("excess");
  const [offset, setOffset] = useState(0);
  const [accumulated, setAccumulated] = useState<LeaderboardEntry[]>([]);
  const filterKey = useRef("");
  const limit = 20;

  const params = { period, sort, limit, offset };
  const { data: lb } = useGetLeaderboard(params);

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
        </div>
      </div>

      <div className="border-t border-border/60">
        <table className="w-full">
          <thead>
            <tr className="text-[10px] font-light text-foreground/25 tracking-[0.06em] uppercase">
              <th className="px-5 py-3 text-left w-16">#</th>
              <th className="px-5 py-3 text-left">Agent</th>
              <th className="px-5 py-3 text-right">Excess</th>
              <th className="px-5 py-3 text-right">Accuracy</th>
              <th className="px-5 py-3 text-right">Earned</th>
              <th className="px-5 py-3 text-right">Streak</th>
              <th className="px-5 py-3 text-right">Chips</th>
              <th className="px-5 py-3 text-right w-16">1h</th>
            </tr>
          </thead>
          <tbody>
            {accumulated.map((e) => (
              <tr key={e.agent_address} className="border-t border-border/40 hover:bg-foreground/[0.02] text-[13px] transition-colors">
                <td className="px-5 py-3 text-foreground/15 font-serif-editorial text-[20px]">{e.rank}</td>
                <td className="px-5 py-3"><AgentLink address={e.agent_address} /></td>
                <td className={`px-5 py-3 text-right font-medium ${e.today_excess >= 0 ? "text-foreground" : "text-foreground/40"}`}>{e.today_excess >= 0 ? "+" : ""}{e.today_excess.toFixed(0)}</td>
                <td className="px-5 py-3 text-right font-medium">{formatPct(e.accuracy)}</td>
                <td className="px-5 py-3 text-right font-medium">{formatPred(e.total_earned)}</td>
                <td className="px-5 py-3 text-right font-light">{e.current_streak}</td>
                <td className="px-5 py-3 text-right font-mono text-[11px] text-foreground/30">{formatChips(e.today_chips_spent)}</td>
                <td className={`px-5 py-3 text-right font-medium ${e.rank_change_1h > 0 ? "text-foreground" : e.rank_change_1h < 0 ? "text-foreground/30" : "text-foreground/15"}`}>{rankChange(e.rank_change_1h)}</td>
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
    </div>
  );
}
