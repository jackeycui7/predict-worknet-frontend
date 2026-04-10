import { useState, useEffect, useRef } from "react";
import {
  useGetHighlights,
} from "@/lib/api";
import { formatPct, formatPred, formatChips, relativeTime, personaLabel } from "@/lib/format";
import { AgentLink, MarketLink } from "@/components/address-link";

const TYPES = [
  { value: "", label: "ALL" },
  { value: "contrarian", label: "CONTRARIAN" },
  { value: "all_in_win", label: "ALL IN" },
  { value: "streak", label: "STREAK" },
  { value: "top_earner", label: "TOP EARNER" },
  { value: "persona_flip", label: "FLIP" },
  { value: "milestone", label: "MILESTONE" },
];

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
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-foreground uppercase">Highlights</h1>
        <div className="flex gap-0">
          {TYPES.map((t, i) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`px-2.5 py-1 text-[10px] font-semibold tracking-[0.06em] border transition-colors ${
                type === t.value
                  ? "bg-foreground text-white border-foreground"
                  : "bg-white text-muted-foreground border-border hover:text-foreground"
              } ${i > 0 ? "border-l-0" : ""}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-[1px] bg-border animate-fade-up">
        {visible.map((h, i) => (
          <div key={`${h.type}-${h.timestamp}-${i}`} className="bento-card p-5">
            <div className="flex items-start justify-between mb-2">
              <span className="text-[9px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">{h.type.replace(/_/g, " ")}</span>
              <span className="text-[10px] text-muted-foreground/50">{relativeTime(h.timestamp)}</span>
            </div>
            <div className="text-base font-bold text-foreground mb-1.5">{h.title}</div>
            <div className="text-[11px] text-muted-foreground leading-relaxed mb-3">{h.description}</div>
            <div className="flex items-center gap-2 text-[11px] flex-wrap">
              {h.agent_address && <AgentLink address={h.agent_address} />}
              {h.agent_persona && <span className="text-[10px] text-muted-foreground">{personaLabel(h.agent_persona)}</span>}
              {h.market_id && <MarketLink id={h.market_id} />}
              {h.direction && <span className={`font-bold text-[10px] tracking-wider ${h.direction === "up" ? "text-primary" : "text-destructive"}`}>{h.direction.toUpperCase()}</span>}
              {h.chips_spent != null && <span className="text-foreground">{formatChips(h.chips_spent)}</span>}
              {h.payout_chips != null && <span className="text-primary font-bold">→ {formatChips(h.payout_chips)}</span>}
              {h.excess != null && <span className="text-primary font-bold">{h.excess >= 0 ? "+" : ""}{h.excess}</span>}
              {h.streak_count != null && <span className="text-primary font-bold">{h.streak_count} streak</span>}
              {h.accuracy != null && <span className="font-bold">{formatPct(h.accuracy)}</span>}
            </div>
          </div>
        ))}
      </div>
      {(!data || data.length === 0) && (
        <div className="bento-card text-center py-16 text-muted-foreground text-sm">No highlights yet</div>
      )}
      {hasMore && (
        <button
          onClick={() => setVisibleCount((c) => c + 20)}
          className="w-full py-2 text-[11px] font-semibold tracking-[0.06em] text-primary border border-primary hover:bg-primary hover:text-white transition-colors uppercase"
        >
          Load More
        </button>
      )}
    </div>
  );
}
