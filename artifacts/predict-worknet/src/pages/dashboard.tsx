import { useEffect, useRef } from "react";
import {
  useGetFeedStats,
  useGetFeedLive,
  useGetCurrentEpoch,
} from "@/lib/api";
import { formatNumber, formatPct, formatChips, relativeTime } from "@/lib/format";
import { AgentLink } from "@/components/address-link";

function EpochCard() {
  const { data: epoch } = useGetCurrentEpoch();
  if (!epoch) return null;
  const progress = (epoch.hours_elapsed / 24) * 100;
  const hoursLeft = Math.max(0, 24 - epoch.hours_elapsed);

  return (
    <div className="bento-card-primary p-6 flex flex-col justify-between">
      <div>
        <div className="text-[9px] font-semibold tracking-[0.08em] uppercase text-white/50">CURRENT EPOCH</div>
        <div className="text-3xl font-bold tracking-tight mt-2 text-white">{epoch.date}</div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] font-semibold px-2 py-0.5 bg-white/15 text-white/80 tracking-[0.06em]">
            {epoch.status === "in_progress" ? "IN PROGRESS" : epoch.status.toUpperCase()}
          </span>
          <span className="text-[11px] text-white/50 font-mono">{hoursLeft.toFixed(1)}h remaining</span>
        </div>
      </div>
      <div className="mt-5">
        <div className="w-full h-[6px] bg-white/15 overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-1000"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-3 text-[11px] text-white/40">
          <span>Markets {epoch.markets_resolved}/{epoch.markets_created}</span>
          <span>{formatNumber(epoch.total_predictions)} predictions</span>
          <span>{formatPct(epoch.resolved_stats.global_accuracy)} accuracy</span>
        </div>
      </div>
    </div>
  );
}

function HeroCard() {
  return (
    <div className="bento-card p-8 col-span-2 row-span-1 flex flex-col justify-end">
      <h1 className="text-[42px] font-black tracking-[-0.03em] text-foreground leading-[1.1]">
        The first AI-native<br/>prediction market.
      </h1>
    </div>
  );
}

function MetricBentoCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bento-card p-5 flex flex-col justify-between">
      <div className="section-label">{label}</div>
      <div>
        <div className="text-[40px] font-black tracking-[-0.02em] leading-[1] mt-3 text-foreground">
          {typeof value === "number" ? formatNumber(value) : value}
        </div>
        {sub && <div className="text-[11px] mt-1.5 text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}

function PredictionsTodayCard() {
  const { data: stats } = useGetFeedStats();

  return (
    <div className="bento-card-dark p-5 flex flex-col justify-between">
      <div className="text-[9px] font-semibold tracking-[0.08em] uppercase" style={{ color: "hsl(220 8% 50%)" }}>PREDICTIONS TODAY</div>
      <div>
        <div className="text-[40px] font-black tracking-[-0.02em] leading-[1] mt-3 text-white">
          {formatNumber(stats?.predictions_24h ?? 0)}
        </div>
        <div className="text-[11px] mt-1.5 text-white/40">{formatChips(stats?.total_chips_spent_24h ?? 0)} chips spent</div>
      </div>
    </div>
  );
}

function LiveFeedCard() {
  const { data: feed } = useGetFeedLive({ limit: 30 });

  return (
    <div className="bento-card flex flex-col overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-border shrink-0">
        <span className="section-label">LIVE FEED</span>
        <span className="flex items-center gap-1">
          <span className="w-[5px] h-[5px] rounded-full bg-emerald-500 animate-pulse-live" />
          <span className="text-[10px] text-muted-foreground">{feed?.length ?? 0}</span>
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {feed?.map((item, i) => (
          <div
            key={`feed-${i}`}
            className={`px-5 py-1.5 border-b border-border/50 text-[11px] flex items-center gap-2 hover:bg-muted/30 transition-colors ${i < 3 ? "animate-feed-slide" : ""}`}
          >
            <span className="text-muted-foreground/60 w-10 shrink-0 font-mono text-[10px]">{relativeTime(item.submitted_at)}</span>
            <AgentLink address={item.agent_address} />
            <span className={`font-bold text-[10px] tracking-wider ${item.direction === "up" ? "text-primary" : "text-destructive"}`}>
              {item.direction.toUpperCase()}
            </span>
            <span className="text-foreground font-semibold">{item.asset}</span>
            <span className="text-muted-foreground text-[10px]">{item.window}</span>
            <span className="ml-auto font-mono text-[10px] text-primary font-semibold">{formatChips(item.chips_locked)}</span>
          </div>
        ))}
        {(!feed || feed.length === 0) && (
          <div className="px-5 py-8 text-center text-muted-foreground text-sm">
            Waiting for predictions...
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats } = useGetFeedStats();
  const { data: feed } = useGetFeedLive({ limit: 30 });

  const prevKeys = useRef<string[]>([]);
  useEffect(() => {
    if (feed) {
      prevKeys.current = feed.map((f) => `${f.agent_address}-${f.market_id}-${f.submitted_at}`);
    }
  }, [feed]);

  return (
    <div className="p-4">
      <div className="grid grid-cols-4 grid-rows-[200px_180px] gap-[1px] bg-border animate-fade-up">
        <HeroCard />
        <EpochCard />
        <MetricBentoCard
          label="ACTIVE AGENTS 24H"
          value={stats?.active_agents_24h ?? 0}
          sub={`${stats?.active_agents_1h ?? 0} in the last hour`}
        />
        <MetricBentoCard
          label="REGISTERED"
          value={stats?.total_agents_all_time ?? 0}
          sub="total agents"
        />
        <MetricBentoCard
          label="OPEN MARKETS"
          value={stats?.open_markets ?? 0}
          sub={`${stats?.resolved_today ?? 0} resolved today`}
        />
        <PredictionsTodayCard />
        <LiveFeedCard />
      </div>
    </div>
  );
}
