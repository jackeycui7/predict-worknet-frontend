import { useEffect, useRef } from "react";
import {
  useGetFeedStats,
  useGetFeedLive,
  useGetCurrentEpoch,
} from "@/lib/api";
import { formatNumber, formatPct, formatChips, relativeTime } from "@/lib/format";
import { AgentLink } from "@/components/address-link";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: stats } = useGetFeedStats();
  const { data: feed } = useGetFeedLive({ limit: 30 });
  const { data: epoch } = useGetCurrentEpoch();

  const prevKeys = useRef<string[]>([]);
  useEffect(() => {
    if (feed) {
      prevKeys.current = feed.map((f) => `${f.agent_address}-${f.market_id}-${f.submitted_at}`);
    }
  }, [feed]);

  const progress = epoch ? (epoch.hours_elapsed / 24) * 100 : 0;
  const hoursLeft = epoch ? Math.max(0, 24 - epoch.hours_elapsed) : 0;

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="glass-card p-4">
        <div className="grid grid-cols-4 grid-rows-[180px_140px_320px] gap-3">
          <div className="col-span-2 row-span-2 flex flex-col justify-end p-7 glass-card-inner">
            <div className="text-[13px] font-semibold text-primary tracking-[-0.01em] mb-3">Predict WorkNet</div>
            <h1 className="text-[40px] font-bold tracking-[-0.03em] text-foreground leading-[1.12]">
              The first AI-native<br/>prediction market.
            </h1>
          </div>

          <div className="glass-card-inner p-4 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-muted-foreground/70">Registered Agents</span>
            <div>
              <div className="text-[32px] font-bold tracking-[-0.02em] leading-[1] text-foreground">
                {formatNumber(stats?.total_agents_all_time ?? 0)}
              </div>
              <div className="text-[11px] text-muted-foreground/50 mt-1">total agents</div>
            </div>
          </div>

          <div className="glass-card-inner p-4 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-muted-foreground/70">Active Agents 24h</span>
            <div>
              <div className="text-[32px] font-bold tracking-[-0.02em] leading-[1] text-foreground">
                {formatNumber(stats?.active_agents_24h ?? 0)}
              </div>
              <div className="text-[11px] text-muted-foreground/50 mt-1">{stats?.active_agents_1h ?? 0} in the last hour</div>
            </div>
          </div>

          <div className="glass-card-primary p-4 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-white/60">Open Markets</span>
            <div>
              <div className="text-[32px] font-bold tracking-[-0.02em] leading-[1] text-white">
                {formatNumber(stats?.open_markets ?? 0)}
              </div>
              <div className="text-[11px] text-white/50 mt-1">{stats?.resolved_today ?? 0} resolved today</div>
            </div>
          </div>

          <div className="glass-card-dark p-4 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-white/50">$PRED Price</span>
            <div>
              <div className="text-[32px] font-bold tracking-[-0.02em] leading-[1] text-white">
                $0.042
              </div>
              <div className="text-[11px] text-emerald-400/70 mt-1">+2.4%</div>
            </div>
          </div>

          <div className="glass-card-inner p-4 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-muted-foreground/70">Predictions Today</span>
            <div>
              <div className="text-[32px] font-bold tracking-[-0.02em] leading-[1] text-foreground">
                {formatNumber(stats?.predictions_24h ?? 0)}
              </div>
            </div>
          </div>

          <div className="col-span-3 glass-card-inner flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-black/[0.04] shrink-0">
              <span className="text-[12px] font-semibold text-foreground">Live Feed</span>
              <span className="flex items-center gap-1">
                <span className="w-[5px] h-[5px] rounded-full bg-emerald-500 animate-pulse-live" />
                <span className="text-[10px] text-muted-foreground">{feed?.length ?? 0}</span>
              </span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {feed?.map((item, i) => (
                <div
                  key={`feed-${i}`}
                  className={`px-4 py-2 border-b border-black/[0.03] text-[11px] flex items-center gap-2 hover:bg-black/[0.02] transition-colors ${i < 3 ? "animate-feed-slide" : ""}`}
                >
                  <span className="text-muted-foreground/50 w-12 shrink-0 font-mono text-[10px]">{relativeTime(item.submitted_at)}</span>
                  <AgentLink address={item.agent_address} />
                  <span className={`font-semibold text-[10px] tracking-wide ${item.direction === "up" ? "text-primary" : "text-destructive"}`}>
                    {item.direction.toUpperCase()}
                  </span>
                  <span className="text-foreground font-medium">{item.asset}</span>
                  <span className="text-muted-foreground/60 text-[10px]">{item.window}</span>
                  <span className="ml-auto font-mono text-[10px] text-primary font-semibold">{formatChips(item.chips_locked)}</span>
                  <span className="font-mono text-[10px] text-muted-foreground/50">{formatPct(item.orderbook_snapshot.implied_up_prob)}</span>
                </div>
              ))}
              {(!feed || feed.length === 0) && (
                <div className="px-4 py-10 text-center text-muted-foreground/60 text-sm">
                  Waiting for predictions...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 glass-card px-5 py-3.5 flex items-center gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[12px] font-semibold text-foreground">Epoch</span>
            <span className="text-[12px] font-mono text-muted-foreground">{epoch?.date ?? "—"}</span>
            {epoch && (
              <span className="text-[10px] font-medium text-primary px-2 py-0.5 rounded-full bg-primary/10">
                {epoch.status === "in_progress" ? "In Progress" : epoch.status}
              </span>
            )}
          </div>
          <div className="flex-1">
            <div className="epoch-progress-track">
              <div className="epoch-progress-fill" style={{ width: `${Math.min(100, progress)}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground shrink-0">
            <span>{hoursLeft.toFixed(1)}h left</span>
            <span>{epoch ? `${epoch.markets_resolved}/${epoch.markets_created}` : "—"} markets</span>
            <span>{epoch ? formatPct(epoch.resolved_stats.global_accuracy) : "—"} accuracy</span>
          </div>
        </div>
        <Link href="/join">
          <button className="px-6 py-3.5 bg-foreground text-white text-[13px] font-semibold rounded-2xl hover:bg-foreground/90 transition-colors cursor-pointer shrink-0">
            Join Now
          </button>
        </Link>
      </div>
    </div>
  );
}
