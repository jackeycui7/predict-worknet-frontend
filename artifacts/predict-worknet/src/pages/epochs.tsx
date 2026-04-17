import { useState, useEffect } from "react";
import {
  useGetEpochs,
  useGetEpochById,
} from "@/lib/api";
import type { EpochSummary } from "@workspace/api-client-react";
import { formatNumber, formatPct, formatPred, formatAwp, personaLabel } from "@/lib/format";
import { AgentLink } from "@/components/address-link";

function EpochDetail({ epochId }: { epochId: number }) {
  const { data: detail } = useGetEpochById(epochId);
  if (!detail) return null;

  return (
    <div className="px-6 py-6 border-t border-border/40 bg-foreground/[0.01]">
      {/* Pool totals — only shown for settled epochs. Unsettled epochs have
          no final emission figure and we do not expose a projection. */}
      <div className={`grid gap-6 mb-8 ${(detail as any).total_emission ? 'grid-cols-3' : 'grid-cols-1'}`}>
        <div>
          <div className="text-[11px] font-medium text-foreground/50 tracking-[0.04em] mb-1">Markets resolved</div>
          <div className="font-serif-editorial text-[28px] text-foreground">{detail.markets_resolved}</div>
        </div>
        {(detail as any).total_emission && (
          <div>
            <div className="text-[11px] font-medium text-foreground/50 tracking-[0.04em] mb-1">$PRED distributed</div>
            <div className="font-serif-editorial text-[28px] text-foreground">{formatPred((detail as any).total_emission)}</div>
          </div>
        )}
        {(detail as any).awp_emission && (
          <div>
            <div className="text-[11px] font-medium text-foreground/50 tracking-[0.04em] mb-1">AWP distributed</div>
            <div className="font-serif-editorial text-[28px] text-foreground">{formatAwp((detail as any).awp_emission)}</div>
          </div>
        )}
      </div>

      {detail.top_earners.length > 0 && (
        <div className="mb-6">
          <span className="section-label">Top earners</span>
          <table className="w-full mt-3">
            <thead>
              <tr className="text-[11px] font-medium text-foreground/50 tracking-[0.04em] uppercase border-b border-border/40">
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Agent</th>
                <th className="px-3 py-2 text-left">Persona</th>
                <th className="px-3 py-2 text-right">Subs</th>
                <th className="px-3 py-2 text-right">Acc</th>
                <th className="px-3 py-2 text-right">Excess</th>
                <th className="px-3 py-2 text-right">$PRED</th>
                <th className="px-3 py-2 text-right">AWP</th>
              </tr>
            </thead>
            <tbody>
              {detail.top_earners.map((e) => (
                <tr key={e.address} className="text-[12px] border-b border-border/30">
                  <td className="px-3 py-2 text-foreground/30 font-serif-editorial text-[16px]">{e.rank}</td>
                  <td className="px-3 py-2"><AgentLink address={e.address} /></td>
                  <td className="px-3 py-2 text-foreground/50 text-[11px]">{personaLabel(e.persona)}</td>
                  <td className="px-3 py-2 text-right text-foreground">{e.valid_submissions}</td>
                  <td className="px-3 py-2 text-right text-foreground font-medium">{formatPct(e.accuracy)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-foreground">{e.excess_score}</td>
                  <td className="px-3 py-2 text-right font-mono text-[11px] font-medium text-foreground">
                    {(e as any).total_reward ? formatPred((e as any).total_reward) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-[11px] font-medium text-foreground">
                    {(e as any).awp_amount ? formatAwp((e as any).awp_amount) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail.persona_breakdown.length > 0 && (
        <div>
          <span className="section-label">Persona breakdown</span>
          <div className="grid grid-cols-4 gap-px bg-border/30 mt-3">
            {detail.persona_breakdown.map((p) => (
              <div key={p.persona} className="bg-background p-4">
                <div className="text-[12px] font-semibold text-foreground">{personaLabel(p.persona)}</div>
                <div className="text-[11px] text-foreground/50 mt-1">{p.agent_count} agents · {formatPct(p.accuracy)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
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
    <div className="animate-fade-up">
      <h1 className="font-serif-editorial text-[48px] tracking-[-0.03em] text-foreground leading-[1] mb-10">Epochs</h1>
      <div className="border-t border-border/60">
        {accumulated.map((ep) => (
          <div key={ep.id} className="border-b border-border/40">
            <div
              className="py-4 flex items-center gap-6 cursor-pointer hover:bg-foreground/[0.02] text-[13px] transition-colors"
              onClick={() => toggle(ep.id)}
            >
              <span className="text-foreground/25 font-serif-editorial text-[24px] w-14">#{ep.id - 4}</span>
              <span className="text-foreground font-semibold w-24">{ep.date}</span>
              <span className="text-[11px] text-foreground/50 tracking-[0.04em] w-16">{ep.status}</span>
              {/* Emission only shown for settled epochs — no projection. */}
              {(ep as any).total_emission ? (
                <span className="text-foreground/50 font-mono text-[11px]"><span className="font-semibold text-foreground">{formatPred((ep as any).total_emission)}</span></span>
              ) : (
                <span className="text-foreground/20 font-mono text-[11px] w-24">—</span>
              )}
              <span className="text-foreground/50"><span className="font-semibold text-foreground">{ep.total_agents}</span> agents</span>
              <span className="text-foreground/50"><span className="font-semibold text-foreground">{formatNumber(ep.total_predictions)}</span> preds</span>
              <span className="text-foreground font-semibold">{formatPct(ep.global_accuracy)}</span>
              <span className="ml-auto text-foreground/30 text-[14px]">{expanded.has(ep.id) ? "−" : "+"}</span>
            </div>
            {expanded.has(ep.id) && <EpochDetail epochId={ep.id} />}
          </div>
        ))}
      </div>
      {data?.pagination?.has_more && (
        <button
          onClick={() => setOffset((o) => o + limit)}
          className="w-full mt-6 py-2.5 text-[12px] text-primary border-t border-border/60 hover:bg-primary/[0.03] transition-colors tracking-[0.04em]"
        >
          Load more
        </button>
      )}
    </div>
  );
}
