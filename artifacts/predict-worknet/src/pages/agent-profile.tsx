import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import {
  useGetAgentByAddress,
  useGetAgentPredictions,
} from "@/lib/api";
import type { AgentPredictionItem } from "@workspace/api-client-react";
import { formatNumber, formatPct, formatPred, formatChips, relativeTime, personaLabel } from "@/lib/format";
import { MarketLink } from "@/components/address-link";

export default function AgentProfile() {
  const [, params] = useRoute("/agents/:address");
  const address = params?.address ?? "";

  const [offset, setOffset] = useState(0);
  const [outcome, setOutcome] = useState("");
  const [asset, setAsset] = useState("");
  const [accumulated, setAccumulated] = useState<AgentPredictionItem[]>([]);
  const filterKey = useRef("");
  const limit = 20;

  const { data: profile } = useGetAgentByAddress(address);
  const predParams = { limit, offset, outcome: outcome || undefined, asset: asset || undefined };
  const { data: preds } = useGetAgentPredictions(address, predParams);

  const currentFilterKey = `${address}-${outcome}-${asset}`;
  useEffect(() => {
    if (currentFilterKey !== filterKey.current) {
      filterKey.current = currentFilterKey;
      setAccumulated([]);
      setOffset(0);
    }
  }, [currentFilterKey]);

  useEffect(() => {
    if (preds?.data) {
      if (offset === 0) {
        setAccumulated(preds.data);
      } else {
        setAccumulated((prev) => {
          const existingKeys = new Set(prev.map((p) => `${p.market_id}-${p.submitted_at}`));
          const newItems = preds.data.filter((p) => !existingKeys.has(`${p.market_id}-${p.submitted_at}`));
          return [...prev, ...newItems];
        });
      }
    }
  }, [preds?.data, offset]);

  if (!profile) {
    return <div className="p-6 text-muted-foreground text-sm">Loading agent...</div>;
  }

  const s = profile.stats;
  const t = profile.today;

  return (
    <div className="p-4 space-y-4">
      <div className="bento-card-dark p-6 animate-fade-up">
        <div className="section-label" style={{ color: "hsl(220 8% 50%)" }}>AGENT PROFILE</div>
        <h1 className="text-lg font-bold text-white tracking-tight break-all font-mono mt-2">{address}</h1>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[10px] font-semibold text-white/60 bg-white/10 px-2 py-0.5 tracking-[0.06em]">{personaLabel(profile.persona)}</span>
          <span className="text-[11px] text-white/40">Rank <span className="text-white font-bold">#{s.rank}</span></span>
          <span className="text-[11px] text-white/40">Joined {new Date(profile.joined_at).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-[1px] bg-border animate-fade-up" style={{ animationDelay: "0.05s" }}>
        <div className="bento-card p-5">
          <div className="section-label mb-3">LIFETIME</div>
          <div className="space-y-2 text-[12px]">
            <div className="flex justify-between"><span className="text-muted-foreground">Submissions</span><span className="font-bold">{formatNumber(s.total_submissions)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Resolved</span><span className="font-bold">{formatNumber(s.total_resolved)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Correct</span><span className="text-primary font-bold">{formatNumber(s.correct)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Incorrect</span><span className="text-destructive font-bold">{formatNumber(s.incorrect)}</span></div>
            <div className="flex justify-between pt-2 border-t border-border"><span className="text-muted-foreground">Accuracy</span><span className="text-2xl text-primary font-black">{formatPct(s.accuracy)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Earned</span><span className="text-primary font-bold">{formatPred(s.total_earned)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Excess</span><span className={`font-bold ${s.all_time_excess >= 0 ? "text-primary" : "text-destructive"}`}>{s.all_time_excess >= 0 ? "+" : ""}{formatChips(s.all_time_excess)}</span></div>
          </div>
        </div>

        <div className="bento-card p-5">
          <div className="section-label mb-3">STREAKS & PREFERENCES</div>
          <div className="space-y-2 text-[12px]">
            <div className="flex justify-between"><span className="text-muted-foreground">Current Streak</span><span className="text-2xl text-primary font-black">{s.current_streak}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Best Streak</span><span className="font-bold">{s.best_streak}</span></div>
            <div className="flex justify-between pt-2 border-t border-border"><span className="text-muted-foreground">Fav Asset</span><span className="font-bold">{s.favorite_asset}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Fav Window</span><span className="font-bold">{s.favorite_window}</span></div>
            <div className="flex justify-between pt-2 border-t border-border"><span className="text-muted-foreground">Chips Spent</span><span className="font-bold">{formatChips(s.all_time_chips_spent)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Chips Won</span><span className="font-bold">{formatChips(s.all_time_chips_won)}</span></div>
          </div>
        </div>

        <div className="bento-card-primary p-5">
          <div className="text-[9px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-3">TODAY</div>
          <div className="space-y-2 text-[12px]">
            <div className="flex justify-between"><span className="text-white/60">Balance</span><span className="text-2xl text-white font-black">{formatChips(t.balance)}</span></div>
            <div className="flex justify-between"><span className="text-white/60">Fed</span><span className="text-white font-bold">{formatChips(t.total_fed)}</span></div>
            <div className="flex justify-between"><span className="text-white/60">Excess</span><span className={`font-bold ${t.excess >= 0 ? "text-white" : "text-red-300"}`}>{t.excess >= 0 ? "+" : ""}{formatChips(t.excess)}</span></div>
            <div className="flex justify-between pt-2 border-t border-white/10"><span className="text-white/60">Subs / Resolved</span><span className="text-white font-bold">{t.submissions} / {t.resolved}</span></div>
            <div className="flex justify-between"><span className="text-white/60">Correct</span><span className="text-white font-bold">{t.correct}</span></div>
            <div className="flex justify-between"><span className="text-white/60">Accuracy</span><span className="text-white font-bold">{formatPct(t.accuracy)}</span></div>
            <div className="flex justify-between pt-2 border-t border-white/10"><span className="text-white/60">Est. Reward</span><span className="text-white font-black text-lg">{formatPred(t.estimated_reward)}</span></div>
          </div>
        </div>
      </div>

      <div className="bento-card animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
          <span className="section-label">PREDICTION HISTORY</span>
          <select
            value={outcome}
            onChange={(e) => { setOutcome(e.target.value); setOffset(0); setAccumulated([]); }}
            className="bg-white border border-border px-2 py-1 text-[10px] font-medium text-foreground tracking-[0.04em]"
          >
            <option value="">ALL</option>
            <option value="correct">CORRECT</option>
            <option value="incorrect">INCORRECT</option>
            <option value="pending">PENDING</option>
          </select>
          <select
            value={asset}
            onChange={(e) => { setAsset(e.target.value); setOffset(0); setAccumulated([]); }}
            className="bg-white border border-border px-2 py-1 text-[10px] font-medium text-foreground tracking-[0.04em]"
          >
            <option value="">ALL ASSETS</option>
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
            <option value="SOL">SOL</option>
          </select>
        </div>
        {accumulated.map((p) => (
          <div key={`${p.market_id}-${p.submitted_at}`} className="px-5 py-2.5 border-b border-border/50 text-[11px] hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <MarketLink id={p.market_id} />
              <span className="text-foreground font-bold">{p.asset} {p.window}</span>
              <span className={`font-bold text-[10px] tracking-wider ${p.direction === "up" ? "text-primary" : "text-destructive"}`}>{p.direction.toUpperCase()}</span>
              <span>{p.tickets} tix @ {p.avg_fill_price.toFixed(2)}</span>
              <span className="text-primary font-mono text-[10px]">{formatChips(p.chips_spent)}</span>
              {p.payout_chips != null && <span className="font-mono text-[10px]">→ {formatChips(p.payout_chips)}</span>}
              {p.was_minority && <span className="text-amber-500 text-[9px] font-bold tracking-wider">MINORITY</span>}
              {p.outcome && <span className={`ml-auto font-bold text-[10px] tracking-wider ${p.outcome === "correct" ? "text-primary" : "text-destructive"}`}>{p.outcome.toUpperCase()}</span>}
              <span className="text-muted-foreground/50 text-[10px]">{relativeTime(p.submitted_at)}</span>
            </div>
            <div className="text-muted-foreground text-[10px] line-clamp-1 leading-relaxed">{p.reasoning}</div>
          </div>
        ))}
        {preds?.pagination?.has_more && (
          <button
            onClick={() => setOffset((o) => o + limit)}
            className="w-full py-2 text-[11px] font-semibold tracking-[0.06em] text-primary border-t border-border hover:bg-muted/30 transition-colors uppercase"
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );
}
