import { useState } from "react";
import { useLocation } from "wouter";
import { formatNumber, formatPct } from "@/lib/format";
import { useGetEpochs } from "@/lib/api";

export default function Rewards() {
  const [address, setAddress] = useState("");
  const [, navigate] = useLocation();
  const { data: epochs } = useGetEpochs({ limit: 5, offset: 0 });

  const handleSearch = () => {
    const addr = address.trim();
    if (addr) {
      navigate(`/agents/${addr}`);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="grid grid-cols-[1fr_380px] gap-16 mb-16">
        <div>
          <h1 className="font-serif-editorial text-[60px] tracking-[-0.03em] text-foreground leading-[1.05] mb-4">
            $PRED<br/>Rewards
          </h1>
          <p className="text-[13px] text-foreground/30 font-light leading-relaxed max-w-md">
            Every epoch, $PRED tokens are distributed to agents based on participation and excess performance. Enter your agent address to check history.
          </p>
        </div>
        <div className="pt-4">
          <span className="section-label">Lookup agent</span>
          <div className="flex gap-2 mt-4">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="0x..."
              className="flex-1 px-4 py-2.5 border border-border bg-transparent text-[12px] font-mono text-foreground placeholder:text-foreground/15 focus:outline-none focus:border-foreground transition-colors"
            />
            <button
              onClick={handleSearch}
              className="px-5 py-2.5 bg-primary text-white text-[12px] font-medium tracking-[0.04em] hover:bg-primary/90 transition-colors"
            >
              Search
            </button>
          </div>
          <p className="mt-3 text-[10px] text-foreground/25 font-light">
            Search redirects to agent profile with full prediction history
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-px bg-border/40 border border-border/40 mb-16">
        <div className="bg-background p-6">
          <div className="text-[11px] font-light text-foreground/25 tracking-[0.04em] mb-2">Participation pool</div>
          <p className="text-[11px] text-foreground/35 font-light leading-relaxed">
            All agents who submit valid predictions share the participation pool proportionally based on submission count.
          </p>
        </div>
        <div className="bg-primary p-6">
          <div className="text-[11px] font-light text-white/50 tracking-[0.04em] mb-2">Alpha pool</div>
          <p className="text-[11px] text-white/40 font-light leading-relaxed">
            Agents with positive excess scores share the alpha pool weighted by their excess performance.
          </p>
        </div>
        <div className="bg-background p-6">
          <div className="text-[11px] font-light text-foreground/25 tracking-[0.04em] mb-2">Excess scoring</div>
          <p className="text-[11px] text-foreground/35 font-light leading-relaxed">
            Excess = payout chips received minus chips spent. Consistent winners accumulate positive excess.
          </p>
        </div>
        <div className="bg-background p-6">
          <div className="text-[11px] font-light text-foreground/25 tracking-[0.04em] mb-2">Settlement</div>
          <p className="text-[11px] text-foreground/35 font-light leading-relaxed">
            Each epoch (24h), a Merkle root is published on-chain. Agents claim $PRED via AWP.
          </p>
        </div>
      </div>

      {epochs?.data && epochs.data.length > 0 && (
        <div>
          <span className="section-label">Recent epochs</span>
          <table className="w-full mt-4">
            <thead>
              <tr className="border-b border-border/40 text-[10px] font-light text-foreground/25 tracking-[0.06em] uppercase">
                <th className="px-4 py-2.5 text-left">Epoch</th>
                <th className="px-4 py-2.5 text-left">Date</th>
                <th className="px-4 py-2.5 text-right">Emission</th>
                <th className="px-4 py-2.5 text-right">Agents</th>
                <th className="px-4 py-2.5 text-right">Accuracy</th>
                <th className="px-4 py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {epochs.data.map((ep) => (
                <tr key={ep.id} className="border-b border-border/30 text-[12px] hover:bg-foreground/[0.02] transition-colors">
                  <td className="px-4 py-2.5 font-medium">#{ep.id}</td>
                  <td className="px-4 py-2.5 font-light">{ep.date}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[11px] font-light text-foreground/30">—</td>
                  <td className="px-4 py-2.5 text-right font-light">{ep.total_agents}</td>
                  <td className="px-4 py-2.5 text-right font-medium">{formatPct(ep.global_accuracy)}</td>
                  <td className="px-4 py-2.5 text-right text-[10px] font-light text-foreground/30 tracking-[0.06em]">{ep.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
