import { useState } from "react";
import {
  useGetEpochs,
  useGetEpochById,
  getGetEpochsQueryKey,
  getGetEpochByIdQueryKey,
} from "@workspace/api-client-react";
import { formatNumber, formatPct, formatPred, personaLabel } from "@/lib/format";
import { AgentLink } from "@/components/address-link";

function EpochRow({ epochId, isExpanded, onToggle }: { epochId: number; isExpanded: boolean; onToggle: () => void }) {
  const { data: detail } = useGetEpochById(epochId, {
    query: { enabled: isExpanded, queryKey: getGetEpochByIdQueryKey(epochId) },
  });

  return (
    <>
      {isExpanded && detail && (
        <div className="px-4 py-4 border-t border-border/50 bg-muted/20">
          <div className="grid grid-cols-3 gap-4 mb-4 text-xs font-mono">
            <div>
              <span className="text-muted-foreground">Participation Pool: </span>
              <span className="text-accent">{formatPred(detail.participation_pool)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Alpha Pool: </span>
              <span className="text-accent">{formatPred(detail.alpha_pool)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Markets Resolved: </span>
              <span>{detail.markets_resolved}</span>
            </div>
          </div>

          {detail.top_earners.length > 0 && (
            <div className="mb-4">
              <div className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Top Earners</div>
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-mono text-muted-foreground uppercase border-b border-border/50">
                    <th className="px-2 py-1 text-left">#</th>
                    <th className="px-2 py-1 text-left">Agent</th>
                    <th className="px-2 py-1 text-left">Persona</th>
                    <th className="px-2 py-1 text-right">Subs</th>
                    <th className="px-2 py-1 text-right">Accuracy</th>
                    <th className="px-2 py-1 text-right">Part.</th>
                    <th className="px-2 py-1 text-right">Alpha</th>
                    <th className="px-2 py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.top_earners.map((e) => (
                    <tr key={e.address} className="text-xs font-mono border-b border-border/30">
                      <td className="px-2 py-1 text-primary">{e.rank}</td>
                      <td className="px-2 py-1"><AgentLink address={e.address} /></td>
                      <td className="px-2 py-1 text-muted-foreground">{personaLabel(e.persona)}</td>
                      <td className="px-2 py-1 text-right">{e.valid_submissions}</td>
                      <td className="px-2 py-1 text-right">{formatPct(e.accuracy)}</td>
                      <td className="px-2 py-1 text-right">{formatPred(e.participation_reward)}</td>
                      <td className="px-2 py-1 text-right">{formatPred(e.alpha_reward)}</td>
                      <td className="px-2 py-1 text-right text-accent font-bold">{formatPred(e.total_reward)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {detail.persona_breakdown.length > 0 && (
            <div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Persona Breakdown</div>
              <div className="grid grid-cols-3 gap-2">
                {detail.persona_breakdown.map((p) => (
                  <div key={p.persona} className="border border-border/50 rounded p-2 text-xs font-mono">
                    <div className="font-bold text-foreground">{personaLabel(p.persona)}</div>
                    <div className="text-muted-foreground">{p.agent_count} agents | {formatPct(p.accuracy)} | {formatPred(p.total_earned)}</div>
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
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const limit = 20;

  const { data } = useGetEpochs({ limit, offset }, { query: { queryKey: getGetEpochsQueryKey({ limit, offset }) } });

  const toggle = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="p-6 space-y-6" data-testid="epochs-page">
      <h1 className="text-xl font-mono font-bold text-foreground">Epochs</h1>
      <div className="space-y-2" data-testid="epochs-list">
        {data?.data?.map((ep) => (
          <div key={ep.id} className="border border-border rounded bg-card overflow-hidden" data-testid={`epoch-${ep.id}`}>
            <div
              className="px-4 py-3 flex items-center gap-4 cursor-pointer hover:bg-muted/30 text-xs font-mono"
              onClick={() => toggle(ep.id)}
            >
              <span className="text-primary font-bold w-12">#{ep.id}</span>
              <span className="text-foreground w-24">{ep.date}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${ep.status === "settled" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"}`}>
                {ep.status.toUpperCase()}
              </span>
              <span className="text-muted-foreground">Emission: <span className="text-accent">{formatPred(ep.total_emission)}</span></span>
              <span className="text-muted-foreground">Agents: {ep.total_agents}</span>
              <span className="text-muted-foreground">Preds: {formatNumber(ep.total_predictions)}</span>
              <span className="text-muted-foreground">Acc: {formatPct(ep.global_accuracy)}</span>
              <span className="ml-auto text-muted-foreground">{expanded.has(ep.id) ? "[-]" : "[+]"}</span>
            </div>
            <EpochRow epochId={ep.id} isExpanded={expanded.has(ep.id)} onToggle={() => toggle(ep.id)} />
          </div>
        ))}
      </div>
      {data?.pagination?.has_more && (
        <button
          onClick={() => setOffset((o) => o + limit)}
          className="w-full py-2 text-xs font-mono text-primary border border-border rounded hover:bg-muted/50"
          data-testid="load-more-epochs"
        >
          Load More
        </button>
      )}
    </div>
  );
}
