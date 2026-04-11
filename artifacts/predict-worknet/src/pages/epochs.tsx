import { useState, useEffect } from "react";
import {
  useGetEpochs,
  useGetEpochById,
} from "@/lib/api";
import type { EpochSummary } from "@workspace/api-client-react";
import { formatNumber, formatPct, formatPred, personaLabel } from "@/lib/format";
import { AgentLink } from "@/components/address-link";

function EpochDetail({ epochId }: { epochId: number }) {
  const { data: detail } = useGetEpochById(epochId);
  if (!detail) return null;

  return (
    <div className="px-6 py-6 border-t border-border/40 bg-foreground/[0.01]">
      <div className="grid grid-cols-3 gap-8 mb-8">
        <div>
          <div className="text-[10px] font-light text-foreground/25 tracking-[0.04em] mb-1">Participation pool</div>
          <div className="font-serif-editorial text-[28px] text-foreground">{formatPred(detail.participation_pool)}</div>
        </div>
        <div>
          <div className="text-[10px] font-light text-foreground/25 tracking-[0.04em] mb-1">Alpha pool</div>
          <div className="font-serif-editorial text-[28px] text-foreground">{formatPred(detail.alpha_pool)}</div>
        </div>
        <div>
          <div className="text-[10px] font-light text-foreground/25 tracking-[0.04em] mb-1">Markets resolved</div>
          <div className="font-serif-editorial text-[28px] text-foreground">{detail.markets_resolved}</div>
        </div>
      </div>

      {detail.top_earners.length > 0 && (
        <div className="mb-6">
          <span className="section-label">Top earners</span>
          <table className="w-full mt-3">
            <thead>
              <tr className="text-[10px] font-light text-foreground/25 tracking-[0.06em] uppercase border-b border-border/40">
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Agent</th>
                <th className="px-3 py-2 text-left">Persona</th>
                <th className="px-3 py-2 text-right">Subs</th>
                <th className="px-3 py-2 text-right">Acc</th>
                <th className="px-3 py-2 text-right">Excess</th>
                <th className="px-3 py-2 text-right">Reward</th>
              </tr>
            </thead>
            <tbody>
              {detail.top_earners.map((e) => (
                <tr key={e.address} className="text-[11px] border-b border-border/30">
                  <td className="px-3 py-1.5 text-foreground/15 font-serif-editorial text-[16px]">{e.rank}</td>
                  <td className="px-3 py-1.5"><AgentLink address={e.address} /></td>
                  <td className="px-3 py-1.5 text-foreground/30 text-[10px] font-light">{personaLabel(e.persona)}</td>
                  <td className="px-3 py-1.5 text-right font-light">{e.valid_submissions}</td>
                  <td className="px-3 py-1.5 text-right font-light">{formatPct(e.accuracy)}</td>
                  <td className="px-3 py-1.5 text-right font-medium">{e.excess_score}</td>
                  <td className="px-3 py-1.5 text-right font-medium">{formatPred(e.total_reward)}</td>
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
                <div className="text-[12px] font-medium text-foreground">{personaLabel(p.persona)}</div>
                <div className="text-[10px] text-foreground/25 font-light mt-1">{p.agent_count} agents · {formatPct(p.accuracy)}</div>
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
              className="py-4 flex items-center gap-6 cursor-pointer hover:bg-foreground/[0.02] text-[12px] transition-colors"
              onClick={() => toggle(ep.id)}
            >
              <span className="text-foreground/10 font-serif-editorial text-[24px] w-14">#{ep.id}</span>
              <span className="text-foreground font-medium w-24">{ep.date}</span>
              <span className="text-[10px] font-light text-foreground/25 tracking-[0.06em] w-16">{ep.status}</span>
              <span className="text-foreground/30 font-light">Emission <span className="text-foreground font-medium">{formatPred(ep.total_emission)}</span></span>
              <span className="text-foreground/30 font-light"><span className="font-medium text-foreground">{ep.total_agents}</span> agents</span>
              <span className="text-foreground/30 font-light"><span className="font-medium text-foreground">{formatNumber(ep.total_predictions)}</span> preds</span>
              <span className="text-foreground font-medium">{formatPct(ep.global_accuracy)}</span>
              <span className="ml-auto text-foreground/20 text-[14px]">{expanded.has(ep.id) ? "−" : "+"}</span>
            </div>
            {expanded.has(ep.id) && <EpochDetail epochId={ep.id} />}
          </div>
        ))}
      </div>
      {data?.pagination?.has_more && (
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
