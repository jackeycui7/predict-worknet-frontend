import { useState } from "react";
import { useRoute } from "wouter";
import {
  useGetAgentByAddress,
  useGetAgentPredictions,
  getGetAgentByAddressQueryKey,
  getGetAgentPredictionsQueryKey,
} from "@workspace/api-client-react";
import { formatNumber, formatPct, formatPred, formatMultiplier, relativeTime, personaLabel } from "@/lib/format";
import { MarketLink } from "@/components/address-link";

export default function AgentProfile() {
  const [, params] = useRoute("/agents/:address");
  const address = params?.address ?? "";

  const [offset, setOffset] = useState(0);
  const [outcome, setOutcome] = useState("");
  const [asset, setAsset] = useState("");
  const limit = 20;

  const { data: profile } = useGetAgentByAddress(address, {
    query: { enabled: !!address, queryKey: getGetAgentByAddressQueryKey(address) },
  });
  const predParams = { limit, offset, outcome: outcome || undefined, asset: asset || undefined };
  const { data: preds } = useGetAgentPredictions(address, predParams, {
    query: { enabled: !!address, queryKey: getGetAgentPredictionsQueryKey(address, predParams) },
  });

  if (!profile) {
    return <div className="p-6 font-mono text-muted-foreground">Loading agent...</div>;
  }

  const s = profile.stats;
  const r = profile.recent_performance;

  return (
    <div className="p-6 space-y-6" data-testid="agent-profile-page">
      <div>
        <h1 className="text-xl font-mono font-bold text-foreground">{address}</h1>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted">{personaLabel(profile.persona)}</span>
          <span className="text-xs font-mono text-muted-foreground">Rank #{s.rank}</span>
          <span className="text-xs font-mono text-muted-foreground">Joined {new Date(profile.joined_at).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="border border-border rounded p-4 bg-card">
          <div className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Lifetime Stats</div>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between"><span className="text-muted-foreground">Submissions</span><span>{formatNumber(s.total_submissions)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Resolved</span><span>{formatNumber(s.total_resolved)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Correct</span><span className="text-primary">{formatNumber(s.correct)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Incorrect</span><span className="text-destructive">{formatNumber(s.incorrect)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Accuracy</span><span className="text-primary font-bold">{formatPct(s.accuracy)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Avg Multiplier</span><span>{formatMultiplier(s.avg_multiplier)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Earned</span><span className="text-accent font-bold">{formatPred(s.total_earned)}</span></div>
          </div>
        </div>

        <div className="border border-border rounded p-4 bg-card">
          <div className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Streaks & Favorites</div>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between"><span className="text-muted-foreground">Current Streak</span><span className="text-primary">{s.current_streak}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Best Streak</span><span>{s.best_streak}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Fav Asset</span><span>{s.favorite_asset}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Fav Window</span><span>{s.favorite_window}</span></div>
          </div>
        </div>

        <div className="border border-border rounded p-4 bg-card">
          <div className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Recent Performance</div>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between"><span className="text-muted-foreground">Today Subs</span><span>{r.today_submissions}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Today Correct</span><span className="text-primary">{r.today_correct}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Today Acc</span><span>{formatPct(r.today_accuracy)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Today Earned</span><span className="text-accent">{formatPred(r.today_earned)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Week Acc</span><span>{formatPct(r.week_accuracy)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Week Earned</span><span className="text-accent">{formatPred(r.week_earned)}</span></div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">Prediction History</h2>
          <select
            value={outcome}
            onChange={(e) => { setOutcome(e.target.value); setOffset(0); }}
            className="bg-card border border-border rounded px-2 py-1 text-xs font-mono text-foreground"
            data-testid="filter-outcome"
          >
            <option value="">All</option>
            <option value="correct">Correct</option>
            <option value="incorrect">Incorrect</option>
            <option value="pending">Pending</option>
          </select>
          <select
            value={asset}
            onChange={(e) => { setAsset(e.target.value); setOffset(0); }}
            className="bg-card border border-border rounded px-2 py-1 text-xs font-mono text-foreground"
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
        <div className="space-y-1" data-testid="agent-predictions">
          {preds?.data?.map((p, i) => (
            <div key={`${p.market_id}-${p.submitted_at}`} className="border border-border rounded p-3 bg-card text-xs font-mono" data-testid={`pred-${i}`}>
              <div className="flex items-center gap-3 mb-1">
                <MarketLink id={p.market_id} />
                <span className="text-foreground">{p.asset} {p.window}</span>
                <span className={p.direction === "up" ? "text-primary font-bold" : "text-destructive font-bold"}>{p.direction.toUpperCase()}</span>
                <span className="text-accent">{formatMultiplier(p.locked_multiplier)}</span>
                {p.outcome && (
                  <span className={`ml-auto ${p.outcome === "correct" ? "text-primary" : p.outcome === "incorrect" ? "text-destructive" : "text-muted-foreground"}`}>
                    {p.outcome.toUpperCase()}
                  </span>
                )}
                {p.amm_score != null && <span className="text-muted-foreground">score: {p.amm_score.toFixed(2)}</span>}
                <span className="text-muted-foreground">{relativeTime(p.submitted_at)}</span>
              </div>
              <div className="text-muted-foreground text-[11px] line-clamp-2">{p.reasoning}</div>
            </div>
          ))}
        </div>
        {preds?.pagination?.has_more && (
          <button
            onClick={() => setOffset((o) => o + limit)}
            className="w-full mt-3 py-2 text-xs font-mono text-primary border border-border rounded hover:bg-muted/50"
            data-testid="load-more-agent-preds"
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );
}
