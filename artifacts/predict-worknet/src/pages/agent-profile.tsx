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
    return <div className="px-8 py-10 text-muted-foreground text-sm">Loading agent...</div>;
  }

  const s = profile.stats;
  const t = profile.today;

  return (
    <div className="px-8 py-8 space-y-8">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-foreground tracking-tight break-all font-mono">{address}</h1>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[11px] font-medium text-muted-foreground px-2 py-0.5 bg-muted">{personaLabel(profile.persona)}</span>
          <span className="text-sm text-muted-foreground">Rank <span className="text-primary font-bold">#{s.rank}</span></span>
          <span className="text-sm text-muted-foreground">Joined {new Date(profile.joined_at).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <div className="border border-border/60 bg-white p-5">
          <div className="text-xs font-semibold text-muted-foreground tracking-wide mb-4 pb-2 border-b border-border/40">LIFETIME</div>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Submissions</span><span className="font-semibold">{formatNumber(s.total_submissions)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Resolved</span><span className="font-semibold">{formatNumber(s.total_resolved)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Correct</span><span className="text-primary font-semibold">{formatNumber(s.correct)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Incorrect</span><span className="text-destructive font-semibold">{formatNumber(s.incorrect)}</span></div>
            <div className="flex justify-between pt-2 border-t border-border/40"><span className="text-muted-foreground">Accuracy</span><span className="text-2xl text-primary font-bold">{formatPct(s.accuracy)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Earned</span><span className="text-lg text-primary font-bold">{formatPred(s.total_earned)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">All-Time Excess</span><span className={`font-semibold ${s.all_time_excess >= 0 ? "text-primary" : "text-destructive"}`}>{s.all_time_excess >= 0 ? "+" : ""}{formatChips(s.all_time_excess)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Contrarian Rate</span><span className="font-semibold">{formatPct(s.contrarian_rate)}</span></div>
          </div>
        </div>

        <div className="border border-border/60 bg-white p-5">
          <div className="text-xs font-semibold text-muted-foreground tracking-wide mb-4 pb-2 border-b border-border/40">STREAKS & PREFERENCES</div>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Current Streak</span><span className="text-2xl text-primary font-bold">{s.current_streak}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Best Streak</span><span className="font-semibold">{s.best_streak}</span></div>
            <div className="flex justify-between pt-2 border-t border-border/40"><span className="text-muted-foreground">Fav Asset</span><span className="font-semibold">{s.favorite_asset}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Fav Window</span><span className="font-semibold">{s.favorite_window}</span></div>
            <div className="flex justify-between pt-2 border-t border-border/40"><span className="text-muted-foreground">Chips Spent (AT)</span><span className="font-semibold">{formatChips(s.all_time_chips_spent)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Chips Won (AT)</span><span className="font-semibold">{formatChips(s.all_time_chips_won)}</span></div>
          </div>
        </div>

        <div className="border border-border/60 bg-white p-5">
          <div className="text-xs font-semibold text-muted-foreground tracking-wide mb-4 pb-2 border-b border-border/40">TODAY</div>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Balance</span><span className="text-2xl text-primary font-bold">{formatChips(t.balance)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Fed Today</span><span className="font-semibold">{formatChips(t.total_fed)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Excess</span><span className={`font-semibold ${t.excess >= 0 ? "text-primary" : "text-destructive"}`}>{t.excess >= 0 ? "+" : ""}{formatChips(t.excess)}</span></div>
            <div className="flex justify-between pt-2 border-t border-border/40"><span className="text-muted-foreground">Subs / Resolved</span><span className="font-semibold">{t.submissions} / {t.resolved}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Correct</span><span className="text-primary font-semibold">{t.correct}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Accuracy</span><span className="text-primary font-semibold">{formatPct(t.accuracy)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Chips Spent</span><span className="font-semibold">{formatChips(t.chips_spent)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Payout</span><span className="text-primary font-semibold">{formatChips(t.payout_received)}</span></div>
            <div className="flex justify-between pt-2 border-t border-border/40"><span className="text-muted-foreground">Est. Reward</span><span className="text-lg text-primary font-bold">{formatPred(t.estimated_reward)}</span></div>
          </div>
        </div>
      </div>

      <div className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-foreground tracking-tight">Prediction History</h2>
          <select
            value={outcome}
            onChange={(e) => { setOutcome(e.target.value); setOffset(0); setAccumulated([]); }}
            className="bg-white border border-border/60 px-3 py-1.5 text-sm text-foreground"
          >
            <option value="">All</option>
            <option value="correct">Correct</option>
            <option value="incorrect">Incorrect</option>
            <option value="pending">Pending</option>
          </select>
          <select
            value={asset}
            onChange={(e) => { setAsset(e.target.value); setOffset(0); setAccumulated([]); }}
            className="bg-white border border-border/60 px-3 py-1.5 text-sm text-foreground"
          >
            <option value="">All Assets</option>
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
            <option value="SOL">SOL</option>
          </select>
        </div>
        <div className="space-y-2">
          {accumulated.map((p, i) => (
            <div key={`${p.market_id}-${p.submitted_at}`} className="border border-border/60 bg-white p-4 text-[12px]">
              <div className="flex items-center gap-3 mb-1.5">
                <MarketLink id={p.market_id} />
                <span className="text-foreground font-semibold">{p.asset} {p.window}</span>
                <span className={`font-semibold ${p.direction === "up" ? "text-primary" : "text-destructive"}`}>{p.direction.toUpperCase()}</span>
                <span className="text-foreground">{p.tickets} tix @ {p.avg_fill_price.toFixed(2)}</span>
                <span className="text-primary font-mono">{formatChips(p.chips_spent)} chips</span>
                {p.payout_chips != null && <span className="text-foreground font-mono">→ {formatChips(p.payout_chips)}</span>}
                {p.was_minority && <span className="text-amber-500 text-[10px] font-medium">MINORITY</span>}
                {p.outcome && (
                  <span className={`ml-auto font-semibold ${p.outcome === "correct" ? "text-primary" : "text-destructive"}`}>
                    {p.outcome.toUpperCase()}
                  </span>
                )}
                <span className="text-muted-foreground text-[11px]">{relativeTime(p.submitted_at)}</span>
              </div>
              <div className="text-muted-foreground text-[11px] line-clamp-2 leading-relaxed">{p.reasoning}</div>
            </div>
          ))}
        </div>
        {preds?.pagination?.has_more && (
          <button
            onClick={() => setOffset((o) => o + limit)}
            className="w-full mt-4 py-2.5 text-sm font-medium text-primary border border-primary hover:bg-primary hover:text-white transition-colors"
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );
}
