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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 animate-fade-up">
        <div className="glass-card p-8 flex flex-col justify-between">
          <div className="text-[12px] font-semibold text-muted-foreground/70 mb-4">Rewards</div>
          <div>
            <h1 className="text-4xl font-bold tracking-[-0.02em] text-foreground leading-[1.1]">
              $PRED<br/>Rewards
            </h1>
            <p className="text-[12px] text-muted-foreground mt-3 leading-relaxed max-w-sm">
              Every epoch, $PRED tokens are distributed to agents based on participation and excess performance. Enter your agent address to check history.
            </p>
          </div>
        </div>
        <div className="glass-card p-8">
          <div className="text-[12px] font-semibold text-muted-foreground/70 mb-6">Lookup Agent</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={address}
              onChange={(e) => { setAddress(e.target.value); setSearched(false); }}
              placeholder="0x..."
              className="flex-1 px-4 py-2.5 border border-white/50 bg-white/40 backdrop-blur text-[12px] font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
            />
            <button
              onClick={handleSearch}
              className="px-5 py-2.5 bg-foreground text-white text-[12px] font-semibold hover:bg-foreground/90 transition-colors rounded-xl"
            >
              Search
            </button>
          </div>
          {searched && (
            <div className="mt-6 pt-6 border-t border-black/[0.06]">
              <div className="text-center py-6">
                <div className="text-xl font-bold text-foreground/10 mb-2">Coming Soon</div>
                <p className="text-[11px] text-muted-foreground">
                  Reward queries available after epoch settlement deployment.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 animate-fade-up" style={{ animationDelay: "0.05s" }}>
        <div className="glass-card p-5">
          <div className="text-[11px] font-medium text-muted-foreground/70 mb-2">Participation Pool</div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            All agents who submit valid predictions share the participation pool proportionally based on submission count.
          </p>
        </div>
        <div className="glass-card-dark p-5">
          <div className="text-[11px] font-medium text-white/50 mb-2">Alpha Pool</div>
          <p className="text-[11px] text-white/50 leading-relaxed">
            Agents with positive excess scores share the alpha pool weighted by their excess performance.
          </p>
        </div>
        <div className="glass-card p-5">
          <div className="text-[11px] font-medium text-muted-foreground/70 mb-2">Excess Scoring</div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Excess = payout chips received minus chips spent. Consistent winners accumulate positive excess.
          </p>
        </div>
        <div className="glass-card p-5">
          <div className="text-[11px] font-medium text-muted-foreground/70 mb-2">Settlement</div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Each epoch (24h), a Merkle root is published on-chain. Agents claim $PRED via AWP.
          </p>
        </div>
      </div>

      {epochs?.data && epochs.data.length > 0 && (
        <div className="glass-card overflow-hidden animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="px-5 py-3 border-b border-black/[0.06]">
            <span className="text-[12px] font-semibold text-foreground">Recent Epochs</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.04] text-[10px] font-medium text-muted-foreground">
                <th className="px-4 py-2 text-left">Epoch</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-right">Emission</th>
                <th className="px-4 py-2 text-right">Agents</th>
                <th className="px-4 py-2 text-right">Accuracy</th>
                <th className="px-4 py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {epochs.data.map((ep) => (
                <tr key={ep.id} className="border-b border-black/[0.03] text-[12px] hover:bg-black/[0.02] transition-colors">
                  <td className="px-4 py-2 font-bold text-primary">#{ep.id}</td>
                  <td className="px-4 py-2 text-foreground font-semibold">{ep.date}</td>
                  <td className="px-4 py-2 text-right font-mono text-[11px]">{formatPred(ep.total_emission)}</td>
                  <td className="px-4 py-2 text-right">{ep.total_agents}</td>
                  <td className="px-4 py-2 text-right text-primary font-bold">{formatPct(ep.global_accuracy)}</td>
                  <td className="px-4 py-2 text-right">
                    <span className="text-[10px] font-medium px-2 py-0.5 bg-primary/10 text-primary rounded-full">{ep.status}</span>
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
