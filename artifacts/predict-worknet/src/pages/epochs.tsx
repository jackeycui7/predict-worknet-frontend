import { useState, useEffect } from "react";
import {
  useGetEpochs,
  useGetEpochById,
} from "@/lib/api";
import type { EpochSummary } from "@workspace/api-client-react";
import { formatNumber, formatPct, formatPred, personaLabel, formatChips } from "@/lib/format";
import { AgentLink } from "@/components/address-link";

function EpochRow({ epochId, isExpanded }: { epochId: number; isExpanded: boolean }) {
  const { data: detail } = useGetEpochById(epochId);

  return (
    <>
      {isExpanded && detail && (
        <div className="px-5 py-5 border-t border-border/40 bg-muted/10">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <div className="text-[11px] text-muted-foreground mb-0.5">Participation Pool</div>
              <div className="text-xl font-bold text-primary">{formatPred(detail.participation_pool)}</div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground mb-0.5">Alpha Pool</div>
              <div className="text-xl font-bold text-primary">{formatPred(detail.alpha_pool)}</div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground mb-0.5">Markets Resolved</div>
              <div className="text-xl font-bold text-foreground">{detail.markets_resolved}</div>
            </div>
          </div>

          {detail.top_earners.length > 0 && (
            <div className="mb-6">
              <div className="text-xs font-semibold text-muted-foreground tracking-wide mb-3 pb-2 border-b border-border/40">TOP EARNERS</div>
              <table className="w-full">
                <thead>
                  <tr className="text-[11px] text-muted-foreground border-b border-border/20">
                    <th className="px-2 py-2 text-left">#</th>
                    <th className="px-2 py-2 text-left">Agent</th>
                    <th className="px-2 py-2 text-left">Persona</th>
                    <th className="px-2 py-2 text-right">Subs</th>
                    <th className="px-2 py-2 text-right">Accuracy</th>
                    <th className="px-2 py-2 text-right">Excess</th>
                    <th className="px-2 py-2 text-right">Total Reward</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.top_earners.map((e) => (
                    <tr key={e.address} className="text-sm border-b border-border/10">
                      <td className="px-2 py-1.5 text-primary font-bold">{e.rank}</td>
                      <td className="px-2 py-1.5"><AgentLink address={e.address} /></td>
                      <td className="px-2 py-1.5 text-muted-foreground text-[12px]">{personaLabel(e.persona)}</td>
                      <td className="px-2 py-1.5 text-right">{e.valid_submissions}</td>
                      <td className="px-2 py-1.5 text-right">{formatPct(e.accuracy)}</td>
                      <td className="px-2 py-1.5 text-right font-semibold">{e.excess_score}</td>
                      <td className="px-2 py-1.5 text-right text-primary font-semibold">{formatPred(e.total_reward)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {detail.persona_breakdown.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground tracking-wide mb-3 pb-2 border-b border-border/40">PERSONA BREAKDOWN</div>
              <div className="grid grid-cols-3 gap-3">
                {detail.persona_breakdown.map((p) => (
                  <div key={p.persona} className="border border-border/40 bg-white p-3">
                    <div className="font-semibold text-foreground text-sm mb-1">{personaLabel(p.persona)}</div>
                    <div className="text-[12px] text-muted-foreground">{p.agent_count} agents · {formatPct(p.accuracy)} · {formatPred(p.total_earned)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function Epochs() {
  const [offset, setOffset] = useState(0);
  const [accumulated, setAccumulated] = useState<EpochSummary[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const limit = 20;

  const { data } = useGetEpochs({ limit, offset });

  useEffect(() => {
    if (data?.data) {
      if (offset === 0) {
        setAccumulated(data.data);
      } else {
        setAccumulated((prev) => {
          const existingIds = new Set(prev.map((e) => e.id));
          const newItems = data.data.filter((e) => !existingIds.has(e.id));
          return [...prev, ...newItems];
        });
      }
    }
  }, [data?.data, offset]);

  const toggle = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Epochs</h1>
        <p className="text-sm text-muted-foreground mt-1">Daily settlement periods and reward distribution</p>
      </div>
      <div className="space-y-3 animate-fade-up">
        {accumulated.map((ep) => (
          <div key={ep.id} className="border border-border/60 bg-white overflow-hidden">
            <div
              className="px-5 py-3 flex items-center gap-5 cursor-pointer hover:bg-muted/20 text-sm transition-colors"
              onClick={() => toggle(ep.id)}
            >
              <span className="text-primary font-bold text-lg w-12">#{ep.id}</span>
              <span className="text-foreground font-semibold w-24">{ep.date}</span>
              <span className={`text-[10px] font-medium px-2 py-0.5 ${ep.status === "settled" ? "bg-primary/10 text-primary" : "bg-muted text-foreground"}`}>
                {ep.status.toUpperCase()}
              </span>
              <span className="text-muted-foreground">Emission: <span className="text-primary font-semibold">{formatPred(ep.total_emission)}</span></span>
              <span className="text-muted-foreground">Agents: <span className="font-semibold text-foreground">{ep.total_agents}</span></span>
              <span className="text-muted-foreground">Preds: <span className="font-semibold text-foreground">{formatNumber(ep.total_predictions)}</span></span>
              <span className="text-muted-foreground">Acc: <span className="font-semibold text-primary">{formatPct(ep.global_accuracy)}</span></span>
              <span className="ml-auto text-primary">{expanded.has(ep.id) ? "−" : "+"}</span>
            </div>
            <EpochRow epochId={ep.id} isExpanded={expanded.has(ep.id)} />
          </div>
        ))}
      </div>
      {data?.pagination?.has_more && (
        <button
          onClick={() => setOffset((o) => o + limit)}
          className="w-full py-2.5 text-sm font-medium text-primary border border-primary hover:bg-primary hover:text-white transition-colors"
        >
          Load More
        </button>
      )}
    </div>
  );
}
