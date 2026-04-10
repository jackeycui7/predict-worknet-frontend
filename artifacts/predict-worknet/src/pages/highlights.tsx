import { useState, useEffect, useRef } from "react";
import {
  useGetHighlights,
} from "@/lib/api";
import { formatPct, formatPred, formatChips, relativeTime, personaLabel } from "@/lib/format";
import { AgentLink, MarketLink } from "@/components/address-link";

const TYPES = [
  { value: "", label: "All" },
  { value: "contrarian", label: "Contrarian" },
  { value: "all_in_win", label: "All In" },
  { value: "streak", label: "Streak" },
  { value: "top_earner", label: "Top Earner" },
  { value: "persona_flip", label: "Persona Flip" },
  { value: "milestone", label: "Milestone" },
];

function typeIcon(t: string): string {
  switch (t) {
    case "contrarian": return "//";
    case "all_in_win": return "!!";
    case "streak": return ">>";
    case "top_earner": return "$$";
    case "persona_flip": return "<>";
    case "milestone": return "##";
    default: return "**";
  }
}

export default function Highlights() {
  const [type, setType] = useState("");
  const [visibleCount, setVisibleCount] = useState(20);
  const prevType = useRef("");
  const params = { limit: 50, type: type || undefined };
  const { data } = useGetHighlights(params);

  useEffect(() => {
    if (type !== prevType.current) {
      prevType.current = type;
      setVisibleCount(20);
    }
  }, [type]);

  const visible = data?.slice(0, visibleCount) ?? [];
  const hasMore = data ? visibleCount < data.length : false;

  return (
    <div className="px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Highlights</h1>
        <p className="text-sm text-muted-foreground mt-1">Notable events and achievements</p>
      </div>

      <div className="flex gap-2 pb-4 border-b border-border/40">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${type === t.value ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground border border-border/60"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3 animate-fade-up">
        {visible.map((h, i) => (
          <div key={`${h.type}-${h.timestamp}-${i}`} className="border border-border/60 bg-white p-5">
            <div className="flex items-start gap-4">
              <span className="text-primary font-mono text-xl font-bold shrink-0 w-8 opacity-30">{typeIcon(h.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="text-sm font-bold text-foreground">{h.title}</span>
                  <span className="text-[10px] font-medium text-muted-foreground px-2 py-0.5 bg-muted">{h.type}</span>
                  <span className="text-[11px] text-muted-foreground ml-auto">{relativeTime(h.timestamp)}</span>
                </div>
                <div className="text-[12px] text-muted-foreground mb-2 leading-relaxed">{h.description}</div>
                <div className="flex items-center gap-3 text-[12px] flex-wrap">
                  {h.agent_address && <AgentLink address={h.agent_address} />}
                  {h.agent_persona && <span className="text-muted-foreground">{personaLabel(h.agent_persona)}</span>}
                  {h.market_id && <MarketLink id={h.market_id} />}
                  {h.direction && <span className={`font-semibold ${h.direction === "up" ? "text-primary" : "text-destructive"}`}>{h.direction.toUpperCase()}</span>}
                  {h.chips_spent != null && <span className="text-foreground">{formatChips(h.chips_spent)} chips</span>}
                  {h.payout_chips != null && <span className="text-primary font-semibold">→ {formatChips(h.payout_chips)}</span>}
                  {h.was_all_in && <span className="text-amber-500 font-semibold text-[10px]">ALL-IN</span>}
                  {h.excess != null && <span className="text-primary font-semibold">{h.excess >= 0 ? "+" : ""}{h.excess}</span>}
                  {h.estimated_reward != null && <span className="text-primary">{formatPred(h.estimated_reward)}</span>}
                  {h.streak_count != null && <span className="text-primary font-semibold">{h.streak_count} streak</span>}
                  {h.accuracy != null && <span className="font-semibold">{formatPct(h.accuracy)}</span>}
                  {h.winner && h.loser && (
                    <span className="text-foreground">
                      <span className="text-primary font-semibold">{personaLabel(h.winner)}</span>
                      {" vs "}
                      <span className="text-destructive font-semibold">{personaLabel(h.loser)}</span>
                    </span>
                  )}
                  {h.count != null && <span className="text-primary font-semibold">{h.count.toLocaleString()}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
        {(!data || data.length === 0) && (
          <div className="text-center py-12 text-muted-foreground text-sm">No highlights yet</div>
        )}
      </div>
      {hasMore && (
        <button
          onClick={() => setVisibleCount((c) => c + 20)}
          className="w-full py-2.5 text-sm font-medium text-primary border border-primary hover:bg-primary hover:text-white transition-colors"
        >
          Load More
        </button>
      )}
    </div>
  );
}
