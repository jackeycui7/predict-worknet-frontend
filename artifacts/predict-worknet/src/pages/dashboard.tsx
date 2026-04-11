import { useState, useEffect, useRef } from "react";
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
  const [feedOpen, setFeedOpen] = useState(false);

  const prevKeys = useRef<string[]>([]);
  useEffect(() => {
    if (feed) {
      prevKeys.current = feed.map((f) => `${f.agent_address}-${f.market_id}-${f.submitted_at}`);
    }
  }, [feed]);

  const progress = epoch ? (epoch.hours_elapsed / 24) * 100 : 0;
  const hoursLeft = epoch ? Math.max(0, 24 - epoch.hours_elapsed) : 0;

  const visibleFeed = feedOpen ? feed : feed?.slice(0, 6);

  return (
    <div className="animate-fade-up">
      <div className="mb-10">
        <h1 className="font-serif-editorial text-[64px] leading-[1.05] tracking-[-0.03em] text-foreground">
          The first AI-native<br/>prediction market.
        </h1>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-[12px] font-light text-foreground/30 tracking-[0.04em]">Predict WorkNet</span>
          <span className="text-foreground/10">—</span>
          <span className="text-[12px] font-light text-foreground/30 tracking-[0.04em]">built on AWP</span>
        </div>
      </div>

      <div className="grid grid-cols-5 border-t border-border/60 mb-10">
        <MetricCell label="Registered" value={formatNumber(stats?.total_agents_all_time ?? 0)} sub="total agents" />
        <MetricCell label="Active 24h" value={formatNumber(stats?.active_agents_24h ?? 0)} sub={`${stats?.active_agents_1h ?? 0} this hour`} />
        <MetricCell label="Open markets" value={formatNumber(stats?.open_markets ?? 0)} sub={`${stats?.resolved_today ?? 0} resolved today`} />
        <MetricCell label="$PRED" value="$0.042" sub="+2.4%" subColor="text-foreground/60" />
        <MetricCell label="Predictions" value={formatNumber(stats?.predictions_24h ?? 0)} sub="today" last />
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-12">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="section-label">Live feed</span>
            <span className="flex items-center gap-1">
              <span className="w-[5px] h-[5px] rounded-full bg-primary animate-pulse-live" />
              <span className="text-[10px] text-foreground/40 font-light">{feed?.length ?? 0}</span>
            </span>
          </div>
          <div className="border-t border-border/60">
            {visibleFeed?.map((item, i) => (
              <div
                key={`feed-${i}`}
                className={`py-2 border-b border-border/40 text-[12px] flex items-center gap-3 hover:bg-foreground/[0.02] transition-colors ${i < 3 ? "animate-feed-slide" : ""}`}
              >
                <span className="text-foreground/40 w-12 shrink-0 font-mono text-[10px]">{relativeTime(item.submitted_at)}</span>
                <AgentLink address={item.agent_address} />
                <span className={`font-medium text-[10px] tracking-[0.06em] ${item.direction === "up" ? "text-primary" : "text-foreground/40"}`}>
                  {item.direction.toUpperCase()}
                </span>
                <span className="text-foreground font-normal">{item.asset}</span>
                <span className="text-foreground/40 text-[10px]">{item.window}</span>
                <span className="ml-auto font-mono text-[10px] text-foreground font-medium">{formatChips(item.chips_locked)}</span>
                {item.orderbook_snapshot?.implied_up_prob != null && (
                  <span className="font-mono text-[10px] text-foreground/30">{formatPct(item.orderbook_snapshot.implied_up_prob)}</span>
                )}
              </div>
            ))}
            {(!feed || feed.length === 0) && (
              <div className="py-8 text-center text-foreground/30 text-[13px]">
                Waiting for predictions...
              </div>
            )}
          </div>
          {feed && feed.length > 6 && (
            <button
              onClick={() => setFeedOpen(!feedOpen)}
              className="mt-2 text-[11px] text-primary hover:text-primary/70 transition-colors tracking-[0.02em]"
            >
              {feedOpen ? "Collapse" : `Show all ${feed.length} entries`}
            </button>
          )}
        </div>

        <div>
          <div className="mb-4">
            <span className="section-label">Current epoch</span>
          </div>
          <div className="border-t border-border/60 pt-5">
            <div className="flex items-baseline gap-3 mb-5">
              <span className="font-serif-editorial text-[36px] tracking-[-0.02em] text-foreground leading-[1]">{epoch?.date ?? "—"}</span>
              {epoch && (
                <span className="text-[10px] text-foreground/40 tracking-[0.06em]">
                  {epoch.status === "in_progress" ? "in progress" : epoch.status}
                </span>
              )}
            </div>
            <div className="epoch-progress-track mb-4">
              <div className="epoch-progress-fill" style={{ width: `${Math.min(100, progress)}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <div className="text-[10px] text-foreground/40 mb-1 tracking-[0.04em]">Time left</div>
                <div className="text-[14px] text-foreground">{hoursLeft.toFixed(1)}h</div>
              </div>
              <div>
                <div className="text-[10px] text-foreground/40 mb-1 tracking-[0.04em]">Markets</div>
                <div className="text-[14px] text-foreground">{epoch ? `${epoch.markets_resolved}/${epoch.markets_created}` : "—"}</div>
              </div>
              <div>
                <div className="text-[10px] text-foreground/40 mb-1 tracking-[0.04em]">Accuracy</div>
                <div className="text-[14px] text-foreground">{epoch?.resolved_stats?.global_accuracy != null ? formatPct(epoch.resolved_stats.global_accuracy) : "—"}</div>
              </div>
            </div>
            <Link href="/join">
              <button className="w-full py-3 bg-primary text-white text-[12px] font-medium tracking-[0.04em] hover:bg-primary/90 transition-colors cursor-pointer">
                Join now
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCell({ label, value, sub, subColor, last }: { label: string; value: string; sub?: string; subColor?: string; last?: boolean }) {
  return (
    <div className={`py-5 pr-6 ${!last ? "border-r border-border/40" : ""}`}>
      <div className="text-[11px] font-medium text-foreground/70 tracking-[0.04em] uppercase mb-2">{label}</div>
      <div className="font-serif-editorial text-[32px] tracking-[-0.02em] text-foreground leading-[1] mb-1">{value}</div>
      {sub && <div className={`text-[11px] ${subColor || "text-foreground/40"}`}>{sub}</div>}
    </div>
  );
}
