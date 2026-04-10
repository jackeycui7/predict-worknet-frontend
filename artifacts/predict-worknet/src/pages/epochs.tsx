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
        <div className="px-5 py-5 border-t border-border bg-muted/20">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="border-t border-border pt-2">
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Participation Pool</div>
              <div className="text-xl font-bold text-primary">{formatPred(detail.participation_pool)}</div>
            </div>
            <div className="border-t border-border pt-2">
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Alpha Pool</div>
              <div className="text-xl font-bold text-primary">{formatPred(detail.alpha_pool)}</div>
            </div>
            <div className="border-t border-border pt-2">
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Markets Resolved</div>
              <div className="text-xl font-bold text-foreground">{detail.markets_resolved}</div>
            </div>
          </div>

          {detail.top_earners.length > 0 && (
            <div className="mb-6">
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3 pb-2 border-b border-border">Top Earners</div>
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest border-b border-border/50">
                    <th className="px-2 py-2 text-left">#</th>
                    <th className="px-2 py-2 text-left">Agent</th>
                    <th className="px-2 py-2 text-left">Persona</th>
                    <th className="px-2 py-2 text-right">Subs</th>
                    <th className="px-2 py-2 text-right">Accuracy</th>
                    <th className="px-2 py-2 text-right">Excess</th>
                    <th className="px-2 py-2 text-right">Part.</th>
                    <th className="px-2 py-2 text-right">Alpha</th>
                    <th className="px-2 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.top_earners.map((e) => (
                    <tr key={e.address} className="text-xs font-mono border-b border-border/30">
                      <td className="px-2 py-1.5 text-primary font-bold">{e.rank}</td>
                      <td className="px-2 py-1.5"><AgentLink address={e.address} /></td>
                      <td className="px-2 py-1.5 text-muted-foreground">{personaLabel(e.persona)}</td>
                      <td className="px-2 py-1.5 text-right">{e.valid_submissions}</td>
                      <td className="px-2 py-1.5 text-right">{formatPct(e.accuracy)}</td>
                      <td className="px-2 py-1.5 text-right font-bold">{e.excess_score}</td>
                      <td className="px-2 py-1.5 text-right">{formatPred(e.participation_reward)}</td>
                      <td className="px-2 py-1.5 text-right">{formatPred(e.alpha_reward)}</td>
                      <td className="px-2 py-1.5 text-right text-primary font-bold">{formatPred(e.total_reward)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {detail.persona_breakdown.length > 0 && (
            <div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3 pb-2 border-b border-border">Persona Breakdown</div>
              <div className="grid grid-cols-3 gap-3">
                {detail.persona_breakdown.map((p) => (
                  <div key={p.persona} className="border border-border bg-card p-3">
                    <div className="font-bold text-foreground text-sm mb-1">{personaLabel(p.persona)}</div>
                    <div className="text-xs font-mono text-muted-foreground">{p.agent_count} agents · {formatPct(p.accuracy)} · excess: {formatChips(p.total_excess)} · {formatPred(p.total_earned)}</div>
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
    <div className="px-6 py-8 space-y-8" data-testid="epochs-page">
      <h1 className="text-4xl font-bold text-primary tracking-tight">Epochs.</h1>
      <div className="space-y-3" data-testid="epochs-list">
        {accumulated.map((ep) => (
          <div key={ep.id} className="border border-border bg-card overflow-hidden" data-testid={`epoch-${ep.id}`}>
            <div
              className="px-5 py-3 flex items-center gap-5 cursor-pointer hover:bg-muted/30 text-xs font-mono"
              onClick={() => toggle(ep.id)}
            >
              <span className="text-primary font-bold text-lg w-12">#{ep.id}</span>
              <span className="text-foreground font-bold w-24">{ep.date}</span>
              <span className={`text-[10px] px-2 py-0.5 border uppercase tracking-wider ${ep.status === "settled" ? "border-primary text-primary" : "border-foreground text-foreground"}`}>
                {ep.status.toUpperCase()}
              </span>
              <span className="text-muted-foreground">Emission: <span className="text-primary font-bold">{formatPred(ep.total_emission)}</span></span>
              <span className="text-muted-foreground">Agents: <span className="font-bold text-foreground">{ep.total_agents}</span></span>
              <span className="text-muted-foreground">Preds: <span className="font-bold text-foreground">{formatNumber(ep.total_predictions)}</span></span>
              <span className="text-muted-foreground">Acc: <span className="font-bold text-primary">{formatPct(ep.global_accuracy)}</span></span>
              <span className="ml-auto text-primary font-bold">{expanded.has(ep.id) ? "−" : "+"}</span>
            </div>
            <EpochRow epochId={ep.id} isExpanded={expanded.has(ep.id)} />
          </div>
        ))}
      </div>
      {data?.pagination?.has_more && (
        <button
          onClick={() => setOffset((o) => o + limit)}
          className="w-full py-2.5 text-xs font-mono text-primary border border-primary uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-colors"
          data-testid="load-more-epochs"
        >
          Load More
        </button>
      )}
    </div>
  );
}
