import { useState } from "react";
import {
  useGetHighlights,
  getGetHighlightsQueryKey,
} from "@workspace/api-client-react";
import { formatMultiplier, formatPct, formatPred, relativeTime, personaLabel } from "@/lib/format";
import { AgentLink, MarketLink } from "@/components/address-link";

const TYPES = [
  { value: "", label: "All" },
  { value: "contrarian", label: "Contrarian" },
  { value: "streak", label: "Streak" },
  { value: "top_earner", label: "Top Earner" },
  { value: "persona_flip", label: "Persona Flip" },
  { value: "milestone", label: "Milestone" },
];

function typeIcon(t: string): string {
  switch (t) {
    case "contrarian": return "//";
    case "streak": return ">>";
    case "top_earner": return "$$";
    case "persona_flip": return "<>";
    case "milestone": return "##";
    default: return "**";
  }
}

export default function Highlights() {
  const [type, setType] = useState("");
  const params = { limit: 20, type: type || undefined };
  const { data } = useGetHighlights(params, {
    query: { refetchInterval: 60000, queryKey: getGetHighlightsQueryKey(params) },
  });

  return (
    <div className="p-6 space-y-6" data-testid="highlights-page">
      <h1 className="text-xl font-mono font-bold text-foreground">Highlights</h1>

      <div className="flex gap-2" data-testid="highlight-filters">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={`px-3 py-1.5 rounded text-xs font-mono ${type === t.value ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
            data-testid={`type-${t.value || "all"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3" data-testid="highlights-list">
        {data?.map((h, i) => (
          <div key={`${h.type}-${h.timestamp}-${i}`} className="border border-border rounded p-4 bg-card" data-testid={`highlight-${i}`}>
            <div className="flex items-start gap-3">
              <span className="text-primary font-mono text-lg font-bold shrink-0 w-8">{typeIcon(h.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-foreground">{h.title}</span>
                  <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted">{h.type}</span>
                  <span className="text-[10px] font-mono text-muted-foreground ml-auto">{relativeTime(h.timestamp)}</span>
                </div>
                <div className="text-xs font-mono text-muted-foreground mb-2">{h.description}</div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  {h.agent_address && <AgentLink address={h.agent_address} />}
                  {h.agent_persona && <span className="text-muted-foreground">{personaLabel(h.agent_persona)}</span>}
                  {h.market_id && <MarketLink id={h.market_id} />}
                  {h.multiplier != null && <span className="text-accent">{formatMultiplier(h.multiplier)}</span>}
                  {h.streak_count != null && <span className="text-primary">{h.streak_count} streak</span>}
                  {h.earned != null && <span className="text-accent">{formatPred(h.earned)}</span>}
                  {h.accuracy != null && <span>{formatPct(h.accuracy)}</span>}
                  {h.winner && h.loser && (
                    <span className="text-foreground">
                      <span className="text-primary">{personaLabel(h.winner)}</span>
                      {" vs "}
                      <span className="text-destructive">{personaLabel(h.loser)}</span>
                    </span>
                  )}
                  {h.count != null && <span className="text-accent">{h.count.toLocaleString()}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
        {(!data || data.length === 0) && (
          <div className="text-center py-8 text-muted-foreground font-mono text-sm">No highlights yet</div>
        )}
      </div>
    </div>
  );
}
