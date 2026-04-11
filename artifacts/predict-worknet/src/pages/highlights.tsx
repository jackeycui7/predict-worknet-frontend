import { useState, useEffect, useRef } from "react";
import {
  useGetHighlights,
} from "@/lib/api";
import { formatPct, formatPred, formatChips, relativeTime, personaLabel } from "@/lib/format";
import { AgentLink, MarketLink } from "@/components/address-link";

const TYPES = [
  { value: "", label: "All" },
  { value: "contrarian", label: "Contrarian" },
  { value: "all_in_win", label: "All in" },
  { value: "streak", label: "Streak" },
  { value: "top_earner", label: "Top earner" },
  { value: "persona_flip", label: "Flip" },
  { value: "milestone", label: "Milestone" },
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
    <div className="animate-fade-up">
      <div className="flex items-baseline justify-between mb-10">
        <h1 className="font-serif-editorial text-[48px] tracking-[-0.03em] text-foreground leading-[1]">Highlights</h1>
        <div className="flex gap-0">
          {TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`px-4 py-1.5 text-[11px] tracking-[0.02em] transition-colors ${
                type === t.value
                  ? "text-foreground font-medium border-b-2 border-foreground"
                  : "text-foreground/30 font-light hover:text-foreground/60"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border/60">
        {visible.map((h, i) => (
          <div key={`${h.type}-${h.timestamp}-${i}`} className="py-5 border-b border-border/40">
            <div className="flex items-start justify-between mb-2">
              <span className="text-[10px] font-light text-foreground/25 tracking-[0.06em] uppercase">{h.type.replace(/_/g, " ")}</span>
              <span className="text-[10px] text-foreground/20 font-light">{relativeTime(h.timestamp)}</span>
            </div>
            <div className="font-serif-editorial text-[22px] text-foreground leading-[1.2] mb-1.5">{h.title}</div>
            <div className="text-[12px] text-foreground/40 font-light leading-relaxed mb-3">{h.description}</div>
            <div className="flex items-center gap-3 text-[11px] flex-wrap">
              {h.agent_address && <AgentLink address={h.agent_address} />}
              {h.agent_persona && <span className="text-[10px] text-foreground/25 font-light">{personaLabel(h.agent_persona)}</span>}
              {h.market_id && <MarketLink id={h.market_id} />}
              {h.direction && <span className={`font-medium text-[10px] tracking-[0.06em] ${h.direction === "up" ? "text-foreground" : "text-foreground/30"}`}>{h.direction.toUpperCase()}</span>}
              {h.chips_spent != null && <span className="text-foreground/40 font-light">{formatChips(h.chips_spent)}</span>}
              {h.payout_chips != null && <span className="text-foreground font-medium">{formatChips(h.payout_chips)}</span>}
              {h.excess != null && <span className="text-foreground font-medium">{h.excess >= 0 ? "+" : ""}{h.excess}</span>}
              {h.streak_count != null && <span className="text-foreground font-medium">{h.streak_count} streak</span>}
              {h.accuracy != null && <span className="font-medium">{formatPct(h.accuracy)}</span>}
            </div>
          </div>
        ))}
      </div>
      {(!data || data.length === 0) && (
        <div className="text-center py-16 text-foreground/20 text-[13px] font-light">No highlights yet</div>
      )}
      {hasMore && (
        <button
          onClick={() => setVisibleCount((c) => c + 20)}
          className="w-full mt-6 py-2.5 text-[12px] font-light text-foreground border-t border-border/60 hover:bg-foreground/[0.02] transition-colors tracking-[0.04em]"
        >
          Load more
        </button>
      )}
    </div>
  );
}
