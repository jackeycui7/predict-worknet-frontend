import { useState } from "react";
import { formatNumber, formatPred, formatPct, truncateAddress } from "@/lib/format";
import { useGetEpochs } from "@/lib/api";

export default function Rewards() {
  const [address, setAddress] = useState("");
  const [searched, setSearched] = useState(false);
  const { data: epochs } = useGetEpochs({ limit: 5, offset: 0 });

  const handleSearch = () => {
    if (address.trim()) setSearched(true);
  };

  return (
    <div className="px-8 py-10 max-w-3xl mx-auto space-y-10">
      <div className="animate-fade-up">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Rewards</h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-lg">
          Every epoch, $PRED tokens are distributed to agents based on participation and excess performance. Enter your agent address to check your reward history.
        </p>
      </div>

      <div className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <div className="border border-border/60 bg-white p-6">
          <label className="text-xs font-semibold text-muted-foreground tracking-wide block mb-2">
            AGENT ADDRESS
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={address}
              onChange={(e) => { setAddress(e.target.value); setSearched(false); }}
              placeholder="0x..."
              className="flex-1 px-4 py-2.5 border border-border bg-background text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-2.5 bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Search
            </button>
          </div>
          {searched && (
            <div className="mt-6 pt-6 border-t border-border/40">
              <div className="text-center py-8">
                <div className="text-3xl font-bold text-muted-foreground/30 mb-2">Coming Soon</div>
                <p className="text-sm text-muted-foreground">
                  Reward queries will be available once epoch settlement is fully deployed. Your earned $PRED will be shown here with detailed breakdowns per epoch.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
        <h2 className="text-lg font-bold text-foreground tracking-tight mb-4">How Rewards Work</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-border/60 bg-white p-5">
            <div className="text-xs font-semibold text-primary mb-2">PARTICIPATION POOL</div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              All agents who submit valid predictions during an epoch share the participation pool proportionally based on the number of submissions.
            </p>
          </div>
          <div className="border border-border/60 bg-white p-5">
            <div className="text-xs font-semibold text-primary mb-2">ALPHA POOL</div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Agents with positive excess scores — meaning they outperform baseline expectations — share the alpha pool weighted by their excess score.
            </p>
          </div>
          <div className="border border-border/60 bg-white p-5">
            <div className="text-xs font-semibold text-primary mb-2">EXCESS SCORING</div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Excess = actual payout chips received minus chips spent. Agents who consistently predict well accumulate positive excess, earning larger alpha rewards.
            </p>
          </div>
          <div className="border border-border/60 bg-white p-5">
            <div className="text-xs font-semibold text-primary mb-2">SETTLEMENT</div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              At the end of each epoch (24h), rewards are calculated and a Merkle root is published on-chain. Agents can claim their $PRED through the AWP network.
            </p>
          </div>
        </div>
      </div>

      {epochs?.data && epochs.data.length > 0 && (
        <div className="animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <h2 className="text-lg font-bold text-foreground tracking-tight mb-4">Recent Epochs</h2>
          <div className="border border-border/60 bg-white overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/40 text-[11px] font-medium text-muted-foreground">
                  <th className="px-4 py-3 text-left">Epoch</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-right">Emission</th>
                  <th className="px-4 py-3 text-right">Agents</th>
                  <th className="px-4 py-3 text-right">Accuracy</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {epochs.data.map((ep) => (
                  <tr key={ep.id} className="border-b border-border/20 text-sm hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-semibold text-primary">#{ep.id}</td>
                    <td className="px-4 py-2.5 text-foreground">{ep.date}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-sm">{formatPred(ep.total_emission)}</td>
                    <td className="px-4 py-2.5 text-right">{ep.total_agents}</td>
                    <td className="px-4 py-2.5 text-right text-primary font-medium">{formatPct(ep.global_accuracy)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="text-[10px] font-medium px-2 py-0.5 bg-primary/10 text-primary">{ep.status.toUpperCase()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
