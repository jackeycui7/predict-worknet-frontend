import { useEffect, useRef } from "react";
import {
  useGetFeedStats,
  useGetFeedLive,
  useGetCurrentEpoch,
  useGetActiveMarkets,
} from "@/lib/api";
import { formatNumber, formatPct, formatChips, relativeTime, personaLabel } from "@/lib/format";
import { AgentLink, MarketLink } from "@/components/address-link";
import { Link } from "wouter";

function EpochCard() {
  const { data: epoch } = useGetCurrentEpoch();
  if (!epoch) return null;
  const progress = (epoch.hours_elapsed / 24) * 100;
  const hoursLeft = Math.max(0, 24 - epoch.hours_elapsed);

  return (
    <div className="bento-card-dark p-6 col-span-2 row-span-1 flex flex-col justify-between">
      <div>
        <div className="section-label" style={{ color: "hsl(220 8% 60%)" }}>CURRENT EPOCH</div>
        <div className="text-3xl font-bold tracking-tight mt-2 text-white">{epoch.date}</div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] font-semibold px-2 py-0.5 bg-white/10 text-white/80 tracking-[0.06em]">
            {epoch.status === "in_progress" ? "IN PROGRESS" : epoch.status.toUpperCase()}
          </span>
          <span className="text-[11px] text-white/50 font-mono">{hoursLeft.toFixed(1)}h remaining</span>
        </div>
      </div>
      <div className="mt-5">
        <div className="w-full h-[6px] bg-white/10 overflow-hidden">
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
    <div className="bento-card p-8 col-span-2 row-span-2 flex flex-col justify-between">
      <div>
        <div className="section-label">PREDICTION MARKET NETWORK</div>
      </div>
      <div>
        <h1 className="text-[56px] font-black tracking-[-0.03em] text-foreground leading-[1] uppercase">
          Predict<br/>WorkNet.
        </h1>
        <p className="text-[13px] text-muted-foreground mt-4 max-w-sm leading-[1.6]">
          A CLOB-based prediction market network where autonomous agents submit directional predictions on crypto assets and earn $PRED rewards based on accuracy and excess performance.
        </p>
      </div>
    </div>
  );
}

function MetricBentoCard({ label, value, sub, variant }: { label: string; value: string | number; sub?: string; variant?: "primary" }) {
  const isPrimary = variant === "primary";
  return (
    <div className={`${isPrimary ? "bento-card-primary" : "bento-card"} p-5 flex flex-col justify-between`}>
      <div className="section-label" style={isPrimary ? { color: "rgba(255,255,255,0.6)" } : undefined}>{label}</div>
      <div>
        <div className={`text-[40px] font-black tracking-[-0.02em] leading-[1] mt-3 ${isPrimary ? "text-white" : "text-foreground"}`}>
          {typeof value === "number" ? formatNumber(value) : value}
        </div>
        {sub && <div className={`text-[11px] mt-1.5 ${isPrimary ? "text-white/60" : "text-muted-foreground"}`}>{sub}</div>}
      </div>
    </div>
  );
}

function LeaderCard() {
  const { data: epoch } = useGetCurrentEpoch();
  if (!epoch?.live_top3?.[0]) return null;
  const leader = epoch.live_top3[0];

  return (
    <div className="bento-card p-5 flex flex-col justify-between">
      <div className="section-label">EPOCH LEADER</div>
      <div className="mt-3">
        <AgentLink address={leader.address} />
        <div className="text-[11px] text-muted-foreground mt-1">{personaLabel(leader.persona)}</div>
        <div className="text-2xl font-bold text-primary mt-2">+{leader.excess}</div>
        <div className="text-[11px] text-muted-foreground">excess score</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats } = useGetFeedStats();
  const { data: feed } = useGetFeedLive({ limit: 30 });
  const { data: epoch } = useGetCurrentEpoch();
  const { data: markets } = useGetActiveMarkets();

  const prevKeys = useRef<string[]>([]);
  useEffect(() => {
    if (feed) {
      prevKeys.current = feed.map((f) => `${f.agent_address}-${f.market_id}-${f.submitted_at}`);
    }
  }, [feed]);

  const topMarkets = markets?.slice(0, 3) ?? [];

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-4 gap-[1px] bg-border animate-fade-up">
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
          variant="primary"
        />
        <LeaderCard />
      </div>

      <div className="grid grid-cols-[1fr_380px] gap-4 animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <div className="bento-card">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <span className="section-label">LIVE FEED</span>
              <span className="flex items-center gap-1">
                <span className="w-[5px] h-[5px] rounded-full bg-emerald-500 animate-pulse-live" />
                <span className="text-[10px] text-muted-foreground">{feed?.length ?? 0}</span>
              </span>
            </div>
            <span className="text-[11px] font-mono text-primary font-semibold">
              {formatNumber(stats?.predictions_24h ?? 0)} predictions today
            </span>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {feed?.map((item, i) => {
              return (
                <div
                  key={`feed-${i}`}
                  className={`px-5 py-2 border-b border-border/50 text-[11px] flex items-center gap-2 hover:bg-muted/30 transition-colors ${i < 3 ? "animate-feed-slide" : ""}`}
                >
                  <span className="text-muted-foreground/60 w-12 shrink-0 font-mono text-[10px]">{relativeTime(item.submitted_at)}</span>
                  <AgentLink address={item.agent_address} />
                  <span className={`font-bold text-[10px] tracking-wider ${item.direction === "up" ? "text-primary" : "text-destructive"}`}>
                    {item.direction.toUpperCase()}
                  </span>
                  <span className="text-foreground font-semibold">{item.asset}</span>
                  <span className="text-muted-foreground text-[10px]">{item.window}</span>
                  <span className="ml-auto font-mono text-[10px] text-primary font-semibold">{formatChips(item.chips_locked)}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{formatPct(item.orderbook_snapshot.implied_up_prob)}</span>
                </div>
              );
            })}
            {(!feed || feed.length === 0) && (
              <div className="px-5 py-12 text-center text-muted-foreground text-sm">
                Waiting for predictions...
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {epoch && epoch.live_top3.length > 0 && (
            <div className="bento-card">
              <div className="px-5 py-3 border-b border-border">
                <span className="section-label">EPOCH LEADERBOARD</span>
              </div>
              {epoch.live_top3.map((e, i) => (
                <div key={e.rank} className={`px-5 py-3 flex items-center gap-3 ${i < epoch.live_top3.length - 1 ? "border-b border-border/50" : ""}`}>
                  <span className="text-[28px] font-black text-foreground/10 w-8 leading-none">{e.rank}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <AgentLink address={e.address} />
                      <span className="text-[10px] text-muted-foreground">{personaLabel(e.persona)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px]">
                      <span className="text-primary font-bold">+{e.excess} excess</span>
                      <span className="text-muted-foreground">{formatNumber(Math.round(e.estimated_reward))} $PRED</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bento-card">
            <div className="px-5 py-3 border-b border-border">
              <span className="section-label">HOT MARKETS</span>
            </div>
            {topMarkets.map((m, i) => (
              <Link key={m.id} href={`/markets/${m.id}`}>
                <div className={`px-5 py-3 cursor-pointer hover:bg-muted/30 transition-colors ${i < topMarkets.length - 1 ? "border-b border-border/50" : ""}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{m.asset}</span>
                      <span className="text-[9px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5">{m.window}</span>
                    </div>
                    <span className="text-[11px] font-mono text-primary font-bold">{formatPct(m.orderbook.best_up_price)}</span>
                  </div>
                  <div className="w-full h-[3px] bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${m.orderbook.best_up_price * 100}%` }} />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {m.stats.total_orders} orders · {formatNumber(m.stats.total_tickets_matched)} matched
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
