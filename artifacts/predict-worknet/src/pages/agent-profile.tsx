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
    return <div className="px-6 py-8 font-mono text-muted-foreground">Loading agent...</div>;
  }

  const s = profile.stats;
  const t = profile.today;

  return (
    <div className="px-6 py-8 space-y-8" data-testid="agent-profile-page">
      <div>
        <h1 className="text-3xl font-bold text-primary tracking-tight break-all">{address}</h1>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 border border-border uppercase tracking-wider">{personaLabel(profile.persona)}</span>
          <span className="text-xs font-mono text-muted-foreground">Rank <span className="text-primary font-bold">#{s.rank}</span></span>
          <span className="text-xs font-mono text-muted-foreground">Joined {new Date(profile.joined_at).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="border border-border bg-card p-5">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-4 pb-2 border-b border-border">Lifetime Stats</div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between"><span className="text-muted-foreground uppercase tracking-wider">Submissions</span><span className="font-bold">{formatNumber(s.total_submissions)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground uppercase tracking-wider">Resolved</span><span className="font-bold">{formatNumber(s.total_resolved)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground uppercase tracking-wider">Correct</span><span className="text-primary font-bold">{formatNumber(s.correct)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground uppercase tracking-wider">Incorrect</span><span className="text-destructive font-bold">{formatNumber(s.incorrect)}</span></div>
            <div className="flex justify-between border-t border-border pt-2 mt-2"><span className="text-muted-foreground uppercase tracking-wider">Accuracy</span><span className="text-2xl text-primary font-bold">{formatPct(s.accuracy)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground uppercase tracking-wider">Total Earned</span><span className="text-2xl text-primary font-bold">{formatPred(s.total_earned)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground uppercase tracking-wider">All-Time Excess</span><span className={`font-bold ${s.all_time_excess >= 0 ? "text-primary" : "text-destructive"}`}>{s.all_time_excess >= 0 ? "+" : ""}{formatChips(s.all_time_excess)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground uppercase tracking-wider">Contrarian Rate</span><span className="font-bold">{formatPct(s.contrarian_rate)}</span></div>
          </div>
        </div>

        <div className="border border-border bg-card p-5">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-4 pb-2 border-b border-border">Streaks & Favorites</div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between"><span className="text-muted-foreground uppercase tracking-wider">Current Streak</span><span className="text-2xl text-primary font-bold">{s.current_streak}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground uppercase tracking-wider">Best Streak</span><span className="font-bold">{s.best_streak}</span></div>
            <div className="flex justify-between border-t border-border pt-2 mt-2"><span className="text-muted-foreground uppercase tracking-wider">Fav Asset</span><span className="font-bold">{s.favorite_asset}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground uppercase tracking-wider">Fav Window</span><span className="font-bold">{s.favorite_window}</span></div>
            <div className="flex justify-between border-t border-border pt-2 mt-2"><span className="text-muted-foreground uppercase tracking-wider">Chips Spent (AT)</span><span className="font-bold">{formatChips(s.all_time_chips_spent)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground uppercase tracking-wider">Chips Won (AT)</span><span className="font-bold">{formatChips(s.all_time_chips_won)}</span></div>
          </div>
        </div>

        <div className="border border-border bg-card p-5">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-4 pb-2 border-b border-border">Today</div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between"><span className="text-muted-foreground uppercase tracking-wider">Balance</span><span className="text-2xl text-primary font-bold">{formatChips(t.balance)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground uppercase tracking-wider">Fed Today</span><span className="font-bold">{formatChips(t.total_fed)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground uppercase tracking-wider">Excess</span><span className={`font-bold ${t.excess >= 0 ? "text-primary" : "text-destructive"}`}>{t.excess >= 0 ? "+" : ""}{formatChips(t.excess)}</span></div>
            <div className="flex justify-between border-t border-border pt-2 mt-2"><span className="text-muted-foreground uppercase tracking-wider">Subs / Resolved</span><span className="font-bold">{t.submissions} / {t.resolved}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground uppercase tracking-wider">Correct</span><span className="text-primary font-bold">{t.correct}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground uppercase tracking-wider">Accuracy</span><span className="text-primary font-bold">{formatPct(t.accuracy)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground uppercase tracking-wider">Chips Spent</span><span className="font-bold">{formatChips(t.chips_spent)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground uppercase tracking-wider">Payout</span><span className="text-primary font-bold">{formatChips(t.payout_received)}</span></div>
            <div className="flex justify-between border-t border-border pt-2 mt-2"><span className="text-muted-foreground uppercase tracking-wider">Est. Reward</span><span className="text-2xl text-primary font-bold">{formatPred(t.estimated_reward)}</span></div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-4 border-b border-border pb-3">
          <h2 className="text-sm font-mono font-bold text-foreground uppercase tracking-widest">Prediction History</h2>
          <select
            value={outcome}
            onChange={(e) => { setOutcome(e.target.value); setOffset(0); setAccumulated([]); }}
            className="bg-card border border-border px-2 py-1 text-xs font-mono text-foreground"
            data-testid="filter-outcome"
          >
            <option value="">All</option>
            <option value="correct">Correct</option>
            <option value="incorrect">Incorrect</option>
            <option value="pending">Pending</option>
          </select>
          <select
            value={asset}
            onChange={(e) => { setAsset(e.target.value); setOffset(0); setAccumulated([]); }}
            className="bg-card border border-border px-2 py-1 text-xs font-mono text-foreground"
            data-testid="filter-asset"
          >
            <option value="">All Assets</option>
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
            <option value="SOL">SOL</option>
            <option value="BNB">BNB</option>
            <option value="DOGE">DOGE</option>
          </select>
        </div>
        <div className="space-y-2" data-testid="agent-predictions">
          {accumulated.map((p, i) => (
            <div key={`${p.market_id}-${p.submitted_at}`} className="border border-border bg-card p-4 text-xs font-mono" data-testid={`pred-${i}`}>
              <div className="flex items-center gap-3 mb-2">
                <MarketLink id={p.market_id} />
                <span className="text-foreground font-bold">{p.asset} {p.window}</span>
                <span className={p.direction === "up" ? "text-primary font-bold" : "text-destructive font-bold"}>{p.direction.toUpperCase()}</span>
                <span className="text-foreground">{p.tickets} tix @ {p.avg_fill_price.toFixed(2)}</span>
                <span className="text-primary">{formatChips(p.chips_spent)} chips</span>
                {p.payout_chips != null && <span className="text-foreground">payout: {formatChips(p.payout_chips)}</span>}
                {p.was_minority && <span className="text-amber-500 text-[10px] uppercase">minority</span>}
                {p.outcome && (
                  <span className={`ml-auto font-bold ${p.outcome === "correct" ? "text-primary" : p.outcome === "incorrect" ? "text-destructive" : "text-muted-foreground"}`}>
                    {p.outcome.toUpperCase()}
                  </span>
                )}
                <span className="text-muted-foreground">{relativeTime(p.submitted_at)}</span>
              </div>
              <div className="text-muted-foreground text-[11px] line-clamp-2">{p.reasoning}</div>
            </div>
          ))}
        </div>
        {preds?.pagination?.has_more && (
          <button
            onClick={() => setOffset((o) => o + limit)}
            className="w-full mt-4 py-2.5 text-xs font-mono text-primary border border-primary uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-colors"
            data-testid="load-more-agent-preds"
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );
}
