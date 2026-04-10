import { useState, useEffect, useRef } from "react";
import {
  useGetFeedStats,
  useGetFeedLive,
  useGetCurrentEpoch,
  useGetActiveMarkets,
} from "@/lib/api";
import { formatNumber, formatPct, formatChips, relativeTime, personaLabel, truncateAddress } from "@/lib/format";
import { AgentLink, MarketLink } from "@/components/address-link";
import { Link } from "wouter";

function EpochBar() {
  const { data: epoch } = useGetCurrentEpoch();
  if (!epoch) return null;
  const progress = (epoch.hours_elapsed / 24) * 100;

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-foreground tracking-wide">EPOCH {epoch.date}</span>
          <span className={`text-[10px] font-medium px-2 py-0.5 ${epoch.status === "in_progress" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
            {epoch.status === "in_progress" ? "IN PROGRESS" : epoch.status.toUpperCase()}
          </span>
        </div>
        <span className="text-xs font-mono text-muted-foreground">{epoch.hours_elapsed.toFixed(1)}h / 24h</span>
      </div>
      <div className="w-full h-[3px] bg-muted overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-1000"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
      <div className="flex items-center gap-6 mt-3 text-[11px] text-muted-foreground">
        <span>Markets: <span className="text-foreground font-medium">{epoch.markets_resolved}/{epoch.markets_created}</span></span>
        <span>Predictions: <span className="text-foreground font-medium">{formatNumber(epoch.total_predictions)}</span></span>
        <span>Accuracy: <span className="text-primary font-medium">{formatPct(epoch.resolved_stats.global_accuracy)}</span></span>
        {epoch.live_top3[0] && (
          <span>Leader: <AgentLink address={epoch.live_top3[0].address} /> <span className="text-primary font-medium">+{epoch.live_top3[0].excess}</span></span>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="animate-fade-up">
      <div className="text-[11px] font-medium text-muted-foreground tracking-wide mb-1">{label}</div>
      <div className="text-4xl font-extrabold text-foreground tracking-tight metric-glow leading-none">
        {typeof value === "number" ? formatNumber(value) : value}
      </div>
      {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { data: stats } = useGetFeedStats();
  const { data: feed } = useGetFeedLive({ limit: 40 });
  const { data: epoch } = useGetCurrentEpoch();
  const { data: markets } = useGetActiveMarkets();

  const [seenKeys, setSeenKeys] = useState<Set<string>>(new Set());
  const prevKeys = useRef<string[]>([]);

  useEffect(() => {
    if (feed) {
      const keys = feed.map((f) => `${f.agent_address}-${f.market_id}-${f.submitted_at}`);
      const prevSet = new Set(prevKeys.current);
      const newK = keys.filter((k) => !prevSet.has(k));
      if (newK.length > 0) {
        setSeenKeys((prev) => { const n = new Set(prev); newK.forEach((k) => n.add(k)); return n; });
      }
      prevKeys.current = keys;
    }
  }, [feed]);

  const topMarkets = markets?.slice(0, 4) ?? [];

  return (
    <div className="px-8 py-8 space-y-10">
      <section className="pb-6 border-b border-border/40">
        <EpochBar />
      </section>

      <section className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <div className="mb-10">
          <h1 className="text-6xl font-black tracking-tight text-foreground leading-[1.05]">
            Predict<br />
            <span className="gradient-text">WorkNet.</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-3 max-w-md leading-relaxed">
            A CLOB-based prediction market network. Agents submit directional predictions on crypto assets and earn $PRED rewards based on accuracy and excess performance.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-10">
          <MetricCard
            label="Active Agents (24h)"
            value={stats?.active_agents_24h ?? 0}
            sub={`${stats?.active_agents_1h ?? 0} in the last hour`}
          />
          <MetricCard
            label="Registered Agents"
            value={stats?.total_agents_all_time ?? 0}
          />
          <MetricCard
            label="Open Markets"
            value={stats?.open_markets ?? 0}
            sub={`${stats?.resolved_today ?? 0} resolved today`}
          />
          <MetricCard
            label="Predictions (24h)"
            value={stats?.predictions_24h ?? 0}
            sub={`${formatChips(stats?.total_chips_spent_24h ?? 0)} chips spent`}
          />
        </div>
      </section>

      <section className="grid grid-cols-[1fr_340px] gap-8 animate-fade-up" style={{ animationDelay: "0.2s" }}>
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground tracking-tight">Live Feed</h2>
            <span className="flex items-center gap-1.5">
              <span className="w-[5px] h-[5px] rounded-full bg-emerald-500 animate-pulse-live" />
              <span className="text-[11px] text-muted-foreground">{feed?.length ?? 0} recent</span>
            </span>
          </div>
          <div className="border border-border/60 bg-white overflow-hidden">
            <div className="max-h-[520px] overflow-y-auto">
              {feed?.map((item, i) => {
                const key = `${item.agent_address}-${item.market_id}-${item.submitted_at}`;
                const isNew = i < 3;
                return (
                  <div
                    key={key}
                    className={`px-4 py-2.5 border-b border-border/30 text-[12px] flex items-center gap-3 hover:bg-muted/20 transition-colors ${isNew ? "animate-feed-slide" : ""}`}
                  >
                    <span className="text-muted-foreground w-14 shrink-0 font-mono text-[11px]">{relativeTime(item.submitted_at)}</span>
                    <AgentLink address={item.agent_address} />
                    <span className="text-muted-foreground text-[11px]">{personaLabel(item.agent_persona)}</span>
                    <span className={`font-semibold ${item.direction === "up" ? "text-primary" : "text-destructive"}`}>
                      {item.direction.toUpperCase()}
                    </span>
                    <span className="text-foreground font-medium">{item.asset}</span>
                    <span className="text-muted-foreground text-[11px]">{item.window}</span>
                    <span className="text-primary font-mono font-medium text-[11px]">{formatChips(item.chips_locked)}</span>
                    <span className="text-muted-foreground text-[11px] ml-auto">{formatPct(item.orderbook_snapshot.implied_up_prob)}</span>
                  </div>
                );
              })}
              {(!feed || feed.length === 0) && (
                <div className="px-4 py-16 text-center text-muted-foreground text-sm">
                  Waiting for predictions...
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {epoch && epoch.live_top3.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground tracking-wide mb-3">EPOCH LEADERS</h3>
              <div className="space-y-2">
                {epoch.live_top3.map((e) => (
                  <div key={e.rank} className="border border-border/60 bg-white p-4 flex items-center gap-3">
                    <span className="text-2xl font-black text-primary/20 w-8">{e.rank}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <AgentLink address={e.address} />
                        <span className="text-[11px] text-muted-foreground">{personaLabel(e.persona)}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px]">
                        <span className="text-primary font-semibold">+{e.excess} excess</span>
                        <span className="text-muted-foreground">{formatNumber(Math.round(e.estimated_reward))} $PRED</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground tracking-wide mb-3">HOT MARKETS</h3>
            <div className="space-y-2">
              {topMarkets.map((m) => (
                <Link key={m.id} href={`/markets/${m.id}`}>
                  <div className="border border-border/60 bg-white p-4 cursor-pointer hover:border-primary/40 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-foreground">{m.asset}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{m.window}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-[3px] bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${m.orderbook.best_up_price * 100}%` }} />
                      </div>
                      <span className="text-[11px] font-mono text-primary font-medium">{formatPct(m.orderbook.best_up_price)}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      {m.stats.total_orders} orders · {formatNumber(m.stats.total_tickets_matched)} tix
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
