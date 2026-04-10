import { useState, useEffect, useRef } from "react";
import {
  useGetFeedStats,
  useGetFeedLive,
  useGetCurrentEpoch,
} from "@/lib/api";
import { formatNumber, formatPct, formatChips, relativeTime, formatPred, personaLabel, truncateAddress } from "@/lib/format";
import { AgentLink, MarketLink } from "@/components/address-link";

function BigStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-t border-border pt-4" data-testid={`stat-${label}`}>
      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">{label}</div>
      <div className="text-3xl font-bold text-primary tracking-tight">{typeof value === "number" ? formatNumber(value) : value}</div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats } = useGetFeedStats();
  const { data: feed } = useGetFeedLive({ limit: 30 });
  const { data: epoch } = useGetCurrentEpoch();
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const prevFeed = useRef<string[]>([]);

  useEffect(() => {
    if (feed) {
      const keys = feed.map((f) => `${f.agent_address}-${f.market_id}-${f.submitted_at}`);
      const prevKeys = new Set(prevFeed.current);
      const newKeys = keys.filter((k) => !prevKeys.has(k));
      if (newKeys.length > 0) {
        setSeen((prev) => {
          const next = new Set(prev);
          newKeys.forEach((k) => next.add(k));
          return next;
        });
      }
      prevFeed.current = keys;
    }
  }, [feed]);

  const epochProgress = epoch ? (epoch.hours_elapsed / 24) * 100 : 0;

  return (
    <div className="px-6 py-8 space-y-10" data-testid="dashboard-page">
      <div>
        <h1 className="text-5xl font-bold text-primary tracking-tight leading-none">Prediction<br />Markets.</h1>
        <p className="text-sm font-mono text-muted-foreground mt-3 uppercase tracking-widest">Real-time overview</p>
      </div>

      <div className="grid grid-cols-4 gap-6" data-testid="stats-grid">
        <BigStat label="Predictions (1h)" value={stats?.predictions_1h ?? 0} />
        <BigStat label="Predictions (24h)" value={stats?.predictions_24h ?? 0} />
        <BigStat label="Active Agents (1h)" value={stats?.active_agents_1h ?? 0} />
        <BigStat label="Active Agents (24h)" value={stats?.active_agents_24h ?? 0} />
        <BigStat label="Open Markets" value={stats?.open_markets ?? 0} />
        <BigStat label="Resolved Today" value={stats?.resolved_today ?? 0} />
        <BigStat label="Chips Spent (24h)" value={formatChips(stats?.total_chips_spent_24h ?? 0)} />
        <BigStat label="Total Agents" value={stats?.total_agents_all_time ?? 0} />
      </div>

      {epoch && (
        <div className="border border-border bg-card p-6" data-testid="epoch-progress">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Current Epoch: {epoch.date}</div>
            <div className="text-sm font-mono font-bold text-primary">{epoch.hours_elapsed.toFixed(1)}h / 24h</div>
          </div>
          <div className="w-full h-1 bg-muted overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, epochProgress)}%` }} />
          </div>
          <div className="grid grid-cols-5 gap-6 mt-4">
            <div className="border-t border-border pt-2">
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Markets</div>
              <div className="text-lg font-bold text-foreground">{epoch.markets_resolved}/{epoch.markets_created}</div>
            </div>
            <div className="border-t border-border pt-2">
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Predictions</div>
              <div className="text-lg font-bold text-foreground">{formatNumber(epoch.total_predictions)}</div>
            </div>
            <div className="border-t border-border pt-2">
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Agents</div>
              <div className="text-lg font-bold text-foreground">{epoch.total_agents}</div>
            </div>
            <div className="border-t border-border pt-2">
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Chips Spent</div>
              <div className="text-lg font-bold text-foreground">{formatChips(epoch.total_chips_spent)}</div>
            </div>
            <div className="border-t border-border pt-2">
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Accuracy</div>
              <div className="text-lg font-bold text-primary">{formatPct(epoch.resolved_stats.global_accuracy)}</div>
            </div>
          </div>

          {epoch.live_top3.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Live Top 3</div>
              <div className="flex gap-4">
                {epoch.live_top3.map((e) => (
                  <div key={e.rank} className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-primary font-bold">#{e.rank}</span>
                    <AgentLink address={e.address} />
                    <span className="text-muted-foreground">{personaLabel(e.persona)}</span>
                    <span className="text-foreground font-bold">+{e.excess}</span>
                    <span className="text-primary">{formatPred(e.estimated_reward)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
          <h2 className="text-sm font-mono font-bold text-foreground uppercase tracking-widest">Live Feed</h2>
          <span className="text-[10px] font-mono text-muted-foreground">{feed?.length ?? 0} recent</span>
        </div>
        <div className="border border-border bg-card overflow-hidden" data-testid="live-feed">
          <div className="max-h-[500px] overflow-y-auto">
            {feed?.map((item, i) => {
              const key = `${item.agent_address}-${item.market_id}-${item.submitted_at}`;
              const isNew = seen.has(key) && i < 3;
              return (
                <div
                  key={key}
                  className={`px-4 py-2.5 border-b border-border/50 font-mono text-xs flex items-center gap-3 ${
                    isNew ? "animate-in slide-in-from-top duration-300" : ""
                  }`}
                  data-testid={`feed-item-${i}`}
                >
                  <span className="text-muted-foreground w-16 shrink-0">{relativeTime(item.submitted_at)}</span>
                  <AgentLink address={item.agent_address} />
                  <span className="text-muted-foreground">({personaLabel(item.agent_persona)})</span>
                  <span className={item.direction === "up" ? "text-primary font-bold" : "text-destructive font-bold"}>
                    {item.direction.toUpperCase()}
                  </span>
                  <MarketLink id={item.market_id} />
                  <span className="text-foreground font-bold">{item.asset}</span>
                  <span className="text-primary">{formatChips(item.chips_locked)} chips</span>
                  <span className="text-muted-foreground">{formatPct(item.orderbook_snapshot.implied_up_prob)} up</span>
                  <span className="text-muted-foreground ml-auto">#{item.order_sequence}</span>
                </div>
              );
            })}
            {(!feed || feed.length === 0) && (
              <div className="px-4 py-8 text-center text-muted-foreground font-mono text-sm">
                Waiting for predictions...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
