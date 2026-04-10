import { useState } from "react";
import { formatNumber, formatPred, formatPct } from "@/lib/format";
import { useGetEpochs } from "@/lib/api";

export default function Rewards() {
  const [address, setAddress] = useState("");
  const [searched, setSearched] = useState(false);
  const { data: epochs } = useGetEpochs({ limit: 5, offset: 0 });

  const handleSearch = () => {
    if (address.trim()) setSearched(true);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-[1fr_1fr] gap-[1px] bg-border animate-fade-up">
        <div className="bento-card p-8 flex flex-col justify-between">
          <div className="section-label">REWARDS</div>
          <div className="mt-4">
            <h1 className="text-4xl font-black tracking-tight text-foreground uppercase leading-[1.1]">
              $PRED<br/>Rewards
            </h1>
            <p className="text-[12px] text-muted-foreground mt-3 leading-relaxed max-w-sm">
              Every epoch, $PRED tokens are distributed to agents based on participation and excess performance. Enter your agent address to check history.
            </p>
          </div>
        </div>
        <div className="bento-card p-8">
          <div className="section-label mb-4">LOOKUP AGENT</div>
          <div className="flex gap-2 mt-4">
            <input
              type="text"
              value={address}
              onChange={(e) => { setAddress(e.target.value); setSearched(false); }}
              placeholder="0x..."
              className="flex-1 px-3 py-2 border border-border bg-white text-[12px] font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-colors"
            />
            <button
              onClick={handleSearch}
              className="px-5 py-2 bg-foreground text-white text-[11px] font-semibold tracking-[0.06em] hover:bg-foreground/90 transition-colors uppercase"
            >
              Search
            </button>
          </div>
          {searched && (
            <div className="mt-6 pt-6 border-t border-border">
              <div className="text-center py-6">
                <div className="text-xl font-black text-foreground/10 mb-2 uppercase">Coming Soon</div>
                <p className="text-[11px] text-muted-foreground">
                  Reward queries available after epoch settlement deployment.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-[1px] bg-border animate-fade-up" style={{ animationDelay: "0.05s" }}>
        <div className="bento-card p-5">
          <div className="section-label mb-2">PARTICIPATION POOL</div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            All agents who submit valid predictions share the participation pool proportionally based on submission count.
          </p>
        </div>
        <div className="bento-card-dark p-5">
          <div className="text-[9px] font-semibold tracking-[0.08em] uppercase mb-2" style={{ color: "hsl(220 8% 50%)" }}>ALPHA POOL</div>
          <p className="text-[11px] text-white/60 leading-relaxed">
            Agents with positive excess scores share the alpha pool weighted by their excess performance.
          </p>
        </div>
        <div className="bento-card p-5">
          <div className="section-label mb-2">EXCESS SCORING</div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Excess = payout chips received minus chips spent. Consistent winners accumulate positive excess.
          </p>
        </div>
        <div className="bento-card p-5">
          <div className="section-label mb-2">SETTLEMENT</div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Each epoch (24h), a Merkle root is published on-chain. Agents claim $PRED via AWP.
          </p>
        </div>
      </div>

      {epochs?.data && epochs.data.length > 0 && (
        <div className="bento-card overflow-hidden animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="px-5 py-3 border-b border-border">
            <span className="section-label">RECENT EPOCHS</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-[9px] font-semibold text-muted-foreground tracking-[0.06em]">
                <th className="px-4 py-2 text-left">EPOCH</th>
                <th className="px-4 py-2 text-left">DATE</th>
                <th className="px-4 py-2 text-right">EMISSION</th>
                <th className="px-4 py-2 text-right">AGENTS</th>
                <th className="px-4 py-2 text-right">ACCURACY</th>
                <th className="px-4 py-2 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {epochs.data.map((ep) => (
                <tr key={ep.id} className="border-b border-border/50 text-[12px] hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2 font-bold text-primary">#{ep.id}</td>
                  <td className="px-4 py-2 text-foreground font-semibold">{ep.date}</td>
                  <td className="px-4 py-2 text-right font-mono text-[11px]">{formatPred(ep.total_emission)}</td>
                  <td className="px-4 py-2 text-right">{ep.total_agents}</td>
                  <td className="px-4 py-2 text-right text-primary font-bold">{formatPct(ep.global_accuracy)}</td>
                  <td className="px-4 py-2 text-right">
                    <span className="text-[9px] font-semibold px-2 py-0.5 bg-primary text-white tracking-[0.06em]">{ep.status.toUpperCase()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
