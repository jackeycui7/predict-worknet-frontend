import { useState, useEffect, useRef } from "react";
import {
  useGetHighlights,
} from "@/lib/api";
import type { HighlightItem } from "@workspace/api-client-react";
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
  const limit = 50;
  const params = { limit, type: type || undefined };
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
    <div className="px-6 py-8 space-y-8" data-testid="highlights-page">
      <h1 className="text-4xl font-bold text-primary tracking-tight">Highlights.</h1>

      <div className="flex gap-2 border-b border-border pb-4" data-testid="highlight-filters">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-widest transition-colors ${type === t.value ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground"}`}
            data-testid={`type-${t.value || "all"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3" data-testid="highlights-list">
        {visible.map((h, i) => (
          <div key={`${h.type}-${h.timestamp}-${i}`} className="border border-border bg-card p-5" data-testid={`highlight-${i}`}>
            <div className="flex items-start gap-4">
              <span className="text-primary font-mono text-2xl font-bold shrink-0 w-10">{typeIcon(h.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-bold text-foreground">{h.title}</span>
                  <span className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 border border-border uppercase tracking-wider">{h.type}</span>
                  <span className="text-[10px] font-mono text-muted-foreground ml-auto">{relativeTime(h.timestamp)}</span>
                </div>
                <div className="text-xs text-muted-foreground mb-3">{h.description}</div>
                <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
                  {h.agent_address && <AgentLink address={h.agent_address} />}
                  {h.agent_persona && <span className="text-muted-foreground">{personaLabel(h.agent_persona)}</span>}
                  {h.market_id && <MarketLink id={h.market_id} />}
                  {h.direction && <span className={h.direction === "up" ? "text-primary font-bold" : "text-destructive font-bold"}>{h.direction.toUpperCase()}</span>}
                  {h.chips_spent != null && <span className="text-foreground">{formatChips(h.chips_spent)} chips</span>}
                  {h.payout_chips != null && <span className="text-primary font-bold">payout: {formatChips(h.payout_chips)}</span>}
                  {h.implied_up_prob_at_submit != null && <span className="text-muted-foreground">{formatPct(h.implied_up_prob_at_submit)} crowd UP</span>}
                  {h.was_all_in && <span className="text-amber-500 font-bold uppercase text-[10px]">All-In</span>}
                  {h.excess != null && <span className="text-primary font-bold">excess: {h.excess >= 0 ? "+" : ""}{h.excess}</span>}
                  {h.estimated_reward != null && <span className="text-primary">{formatPred(h.estimated_reward)}</span>}
                  {h.streak_count != null && <span className="text-primary font-bold">{h.streak_count} streak</span>}
                  {h.accuracy != null && <span className="font-bold">{formatPct(h.accuracy)}</span>}
                  {h.winner && h.loser && (
                    <span className="text-foreground">
                      <span className="text-primary font-bold">{personaLabel(h.winner)}</span>
                      {" vs "}
                      <span className="text-destructive font-bold">{personaLabel(h.loser)}</span>
                    </span>
                  )}
                  {h.count != null && <span className="text-primary font-bold">{h.count.toLocaleString()}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
        {(!data || data.length === 0) && (
          <div className="text-center py-12 text-muted-foreground font-mono text-sm">No highlights yet</div>
        )}
      </div>
      {hasMore && (
        <button
          onClick={() => setVisibleCount((c) => c + 20)}
          className="w-full py-2.5 text-xs font-mono text-primary border border-primary uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-colors"
          data-testid="load-more-highlights"
        >
          Load More
        </button>
      )}
    </div>
  );
}
