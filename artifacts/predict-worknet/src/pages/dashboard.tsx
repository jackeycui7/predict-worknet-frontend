import { useState, useEffect, useRef } from "react";
import {
  useGetFeedStats,
  useGetFeedLive,
  useGetCurrentEpoch,
  getGetFeedStatsQueryKey,
  getGetFeedLiveQueryKey,
  getGetCurrentEpochQueryKey,
} from "@workspace/api-client-react";
import { formatNumber, formatPct, relativeTime, formatMultiplier, formatPred, personaLabel } from "@/lib/format";
import { AgentLink, MarketLink } from "@/components/address-link";

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-border rounded p-3 bg-card" data-testid={`stat-${label}`}>
      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-lg font-mono font-bold text-foreground mt-1">{typeof value === "number" ? formatNumber(value) : value}</div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats } = useGetFeedStats({ query: { refetchInterval: 30000, queryKey: getGetFeedStatsQueryKey() } });
  const { data: feed } = useGetFeedLive({ limit: 30 }, { query: { refetchInterval: 5000, queryKey: getGetFeedLiveQueryKey({ limit: 30 }) } });
  const { data: epoch } = useGetCurrentEpoch({ query: { refetchInterval: 30000, queryKey: getGetCurrentEpochQueryKey() } });
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
    <div className="p-6 space-y-6" data-testid="dashboard-page">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-mono font-bold text-foreground">Dashboard</h1>
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse-green" />
      </div>

      <div className="grid grid-cols-4 gap-3" data-testid="stats-grid">
        <StatBox label="Predictions (1h)" value={stats?.predictions_1h ?? 0} />
        <StatBox label="Predictions (24h)" value={stats?.predictions_24h ?? 0} />
        <StatBox label="Active Agents (1h)" value={stats?.active_agents_1h ?? 0} />
        <StatBox label="Active Agents (24h)" value={stats?.active_agents_24h ?? 0} />
        <StatBox label="Open Markets" value={stats?.open_markets ?? 0} />
        <StatBox label="Resolved Today" value={stats?.resolved_today ?? 0} />
        <StatBox label="Total Predictions" value={stats?.total_predictions_all_time ?? 0} />
        <StatBox label="Total Agents" value={stats?.total_agents_all_time ?? 0} />
      </div>

      {epoch && (
        <div className="border border-border rounded p-4 bg-card" data-testid="epoch-progress">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-mono text-muted-foreground">CURRENT EPOCH: {epoch.date}</div>
            <div className="text-xs font-mono text-muted-foreground">{epoch.hours_elapsed.toFixed(1)}h / 24h</div>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, epochProgress)}%` }} />
          </div>
          <div className="grid grid-cols-4 gap-4 mt-3 text-xs font-mono">
            <div><span className="text-muted-foreground">Markets: </span><span className="text-foreground">{epoch.markets_resolved}/{epoch.markets_created}</span></div>
            <div><span className="text-muted-foreground">Predictions: </span><span className="text-foreground">{formatNumber(epoch.total_predictions)}</span></div>
            <div><span className="text-muted-foreground">Agents: </span><span className="text-foreground">{epoch.total_agents}</span></div>
            <div><span className="text-muted-foreground">Accuracy: </span><span className="text-foreground">{formatPct(epoch.resolved_stats.global_accuracy)}</span></div>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">Live Feed</h2>
          <span className="text-[10px] font-mono text-muted-foreground">({feed?.length ?? 0} recent)</span>
        </div>
        <div className="border border-border rounded bg-card overflow-hidden" data-testid="live-feed">
          <div className="max-h-[500px] overflow-y-auto">
            {feed?.map((item, i) => {
              const key = `${item.agent_address}-${item.market_id}-${item.submitted_at}`;
              const isNew = seen.has(key) && i < 3;
              return (
                <div
                  key={key}
                  className={`px-4 py-2 border-b border-border/50 font-mono text-xs flex items-center gap-3 ${
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
                  <span className="text-foreground">{item.asset}</span>
                  <span className="text-accent">{formatMultiplier(item.locked_multiplier)}</span>
                  <span className="text-muted-foreground ml-auto">#{item.position_in_market}</span>
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
