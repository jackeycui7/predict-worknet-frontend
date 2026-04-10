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
    <div className="px-5 py-5 border-t border-border bg-muted/10">
      <div className="grid grid-cols-3 gap-[1px] bg-border mb-5">
        <div className="bg-white p-4">
          <div className="text-[9px] text-muted-foreground tracking-wider font-semibold">PARTICIPATION POOL</div>
          <div className="text-2xl font-black text-primary mt-1">{formatPred(detail.participation_pool)}</div>
        </div>
        <div className="bg-white p-4">
          <div className="text-[9px] text-muted-foreground tracking-wider font-semibold">ALPHA POOL</div>
          <div className="text-2xl font-black text-primary mt-1">{formatPred(detail.alpha_pool)}</div>
        </div>
        <div className="bg-white p-4">
          <div className="text-[9px] text-muted-foreground tracking-wider font-semibold">MARKETS RESOLVED</div>
          <div className="text-2xl font-black text-foreground mt-1">{detail.markets_resolved}</div>
        </div>
      </div>

      {detail.top_earners.length > 0 && (
        <div className="bento-card overflow-hidden mb-4">
          <div className="px-4 py-2 border-b border-border">
            <span className="section-label">TOP EARNERS</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-[9px] text-muted-foreground border-b border-border/50 tracking-wider font-semibold">
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">AGENT</th>
                <th className="px-3 py-2 text-left">PERSONA</th>
                <th className="px-3 py-2 text-right">SUBS</th>
                <th className="px-3 py-2 text-right">ACC</th>
                <th className="px-3 py-2 text-right">EXCESS</th>
                <th className="px-3 py-2 text-right">REWARD</th>
              </tr>
            </thead>
            <tbody>
              {detail.top_earners.map((e) => (
                <tr key={e.address} className="text-[11px] border-b border-border/30">
                  <td className="px-3 py-1.5 text-foreground/20 font-black">{e.rank}</td>
                  <td className="px-3 py-1.5"><AgentLink address={e.address} /></td>
                  <td className="px-3 py-1.5 text-muted-foreground text-[10px]">{personaLabel(e.persona)}</td>
                  <td className="px-3 py-1.5 text-right">{e.valid_submissions}</td>
                  <td className="px-3 py-1.5 text-right">{formatPct(e.accuracy)}</td>
                  <td className="px-3 py-1.5 text-right font-bold">{e.excess_score}</td>
                  <td className="px-3 py-1.5 text-right text-primary font-bold">{formatPred(e.total_reward)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail.persona_breakdown.length > 0 && (
        <div>
          <div className="section-label mb-2">PERSONA BREAKDOWN</div>
          <div className="grid grid-cols-4 gap-[1px] bg-border">
            {detail.persona_breakdown.map((p) => (
              <div key={p.persona} className="bg-white p-3">
                <div className="font-bold text-foreground text-[12px]">{personaLabel(p.persona)}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{p.agent_count} agents · {formatPct(p.accuracy)}</div>
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
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold tracking-tight text-foreground uppercase">Epochs</h1>
      <div className="space-y-[1px] bg-border animate-fade-up">
        {accumulated.map((ep) => (
          <div key={ep.id} className="bento-card overflow-hidden">
            <div
              className="px-5 py-3 flex items-center gap-4 cursor-pointer hover:bg-muted/30 text-[12px] transition-colors"
              onClick={() => toggle(ep.id)}
            >
              <span className="text-foreground/15 font-black text-xl w-10">#{ep.id}</span>
              <span className="text-foreground font-bold w-24">{ep.date}</span>
              <span className={`text-[9px] font-semibold px-2 py-0.5 tracking-[0.06em] ${ep.status === "settled" ? "bg-primary text-white" : "bg-muted text-foreground"}`}>
                {ep.status.toUpperCase()}
              </span>
              <span className="text-muted-foreground">Emission <span className="text-primary font-bold">{formatPred(ep.total_emission)}</span></span>
              <span className="text-muted-foreground"><span className="font-bold text-foreground">{ep.total_agents}</span> agents</span>
              <span className="text-muted-foreground"><span className="font-bold text-foreground">{formatNumber(ep.total_predictions)}</span> preds</span>
              <span className="text-muted-foreground"><span className="font-bold text-primary">{formatPct(ep.global_accuracy)}</span></span>
              <span className="ml-auto text-muted-foreground text-[11px]">{expanded.has(ep.id) ? "−" : "+"}</span>
            </div>
            {expanded.has(ep.id) && <EpochDetail epochId={ep.id} />}
          </div>
        ))}
      </div>
      {data?.pagination?.has_more && (
        <button
          onClick={() => setOffset((o) => o + limit)}
          className="w-full py-2 text-[11px] font-semibold tracking-[0.06em] text-primary border border-primary hover:bg-primary hover:text-white transition-colors uppercase"
        >
          Load More
        </button>
      )}
    </div>
  );
}
