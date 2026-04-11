import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  useGetActiveMarkets,
  useGetResolvedMarkets,
} from "@/lib/api";
import type { MarketItem } from "@workspace/api-client-react";
import { formatPct, formatPrice, countdownStr, formatNumber } from "@/lib/format";

function CountdownTimer({ closesAt }: { closesAt: string }) {
  const [display, setDisplay] = useState(countdownStr(closesAt));
  useEffect(() => {
    const id = setInterval(() => setDisplay(countdownStr(closesAt)), 1000);
    return () => clearInterval(id);
  }, [closesAt]);
  const isClosed = display === "CLOSED";
  return (
    <span className={`font-mono text-[11px] font-bold tracking-wide ${isClosed ? "text-destructive" : "text-primary"}`}>
      {display}
    </span>
  );
}

function getLast7Days(): { date: string; label: string; dayLabel: string }[] {
  const days: { date: string; label: string; dayLabel: string }[] = [];
  const now = new Date();
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayNum = d.getDate();
    const dayName = i === 0 ? "Today" : i === 1 ? "Yday" : weekDays[d.getDay()];
    days.push({ date: dateStr, label: String(dayNum), dayLabel: dayName });
  }
  return days;
}

export default function Markets() {
  const [tab, setTab] = useState<"active" | "resolved">("active");
  const [asset, setAsset] = useState("");
  const [window, setWindow] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [offset, setOffset] = useState(0);
  const [accumulated, setAccumulated] = useState<MarketItem[]>([]);
  const filterKey = useRef("");
  const limit = 20;

  const { data: active } = useGetActiveMarkets();
  const { data: resolved } = useGetResolvedMarkets(
    { limit, offset, asset: asset || undefined, window: window || undefined }
  );

  const currentFilterKey = `${asset}-${window}-${selectedDate}`;
  useEffect(() => {
    if (currentFilterKey !== filterKey.current) {
      filterKey.current = currentFilterKey;
      setAccumulated([]);
      setOffset(0);
    }
  }, [currentFilterKey]);

  useEffect(() => {
    if (tab === "resolved" && resolved?.data) {
      const filtered = selectedDate
        ? resolved.data.filter((m) => m.close_at.slice(0, 10) === selectedDate)
        : resolved.data;
      if (offset === 0) {
        setAccumulated(filtered);
      } else {
        setAccumulated((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newItems = filtered.filter((m) => !existingIds.has(m.id));
          return [...prev, ...newItems];
        });
      }
    }
  }, [resolved?.data, offset, tab, selectedDate]);

  const assets = ["BTC", "ETH", "SOL", "BNB", "DOGE"];
  const windows = ["15m", "30m", "1h"];
  const last7 = getLast7Days();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Markets</h1>
          <div className="flex gap-1 ml-2">
            <button
              onClick={() => setTab("active")}
              className={`px-3.5 py-1.5 text-[12px] font-medium rounded-full transition-colors ${
                tab === "active"
                  ? "bg-foreground text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04]"
              }`}
            >
              Active ({active?.length ?? 0})
            </button>
            <button
              onClick={() => { setTab("resolved"); setOffset(0); setAccumulated([]); }}
              className={`px-3.5 py-1.5 text-[12px] font-medium rounded-full transition-colors ${
                tab === "resolved"
                  ? "bg-foreground text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04]"
              }`}
            >
              Resolved
            </button>
          </div>
        </div>

        {tab === "resolved" && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {last7.map((d) => {
                const isSelected = d.date === selectedDate;
                return (
                  <button
                    key={d.date}
                    onClick={() => setSelectedDate(isSelected ? "" : d.date)}
                    className={`flex flex-col items-center w-10 py-1.5 text-center transition-colors rounded-lg ${
                      isSelected
                        ? "bg-primary text-white"
                        : "text-foreground hover:bg-black/[0.04]"
                    }`}
                  >
                    <span className={`text-[9px] font-medium tracking-wider ${isSelected ? "text-white/70" : "text-muted-foreground"}`}>
                      {d.dayLabel}
                    </span>
                    <span className="text-[13px] font-bold leading-tight">{d.label}</span>
                  </button>
                );
              })}
            </div>
            <select
              value={asset}
              onChange={(e) => { setAsset(e.target.value); setOffset(0); setAccumulated([]); }}
              className="bg-white/60 backdrop-blur border border-white/50 px-2.5 py-1.5 text-[11px] font-medium text-foreground rounded-lg"
            >
              <option value="">All Assets</option>
              {assets.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <select
              value={window}
              onChange={(e) => { setWindow(e.target.value); setOffset(0); setAccumulated([]); }}
              className="bg-white/60 backdrop-blur border border-white/50 px-2.5 py-1.5 text-[11px] font-medium text-foreground rounded-lg"
            >
              <option value="">All Windows</option>
              {windows.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
        )}
      </div>

      {tab === "active" && (
        <div className="grid grid-cols-2 gap-3 animate-fade-up">
          {active?.map((m) => (
            <Link key={m.id} href={`/markets/${m.id}`}>
              <div className="glass-card p-5 cursor-pointer h-full hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-foreground tracking-tight">{m.asset}</span>
                    <span className="text-[9px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{m.window}</span>
                  </div>
                  <CountdownTimer closesAt={m.close_at} />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-primary font-bold text-sm">{formatPct(m.orderbook.best_up_price)}</span>
                  <div className="flex-1 h-[4px] bg-muted overflow-hidden rounded-full">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${m.orderbook.best_up_price * 100}%` }} />
                  </div>
                  <span className="text-destructive font-bold text-sm">{formatPct(m.orderbook.best_down_price)}</span>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span>Open <span className="text-foreground font-semibold">{formatPrice(m.open_price)}</span></span>
                  <span><span className="text-foreground font-semibold">{m.stats.total_orders}</span> orders</span>
                  <span><span className="text-foreground font-semibold">{formatNumber(m.stats.total_tickets_matched)}</span> matched</span>
                </div>
              </div>
            </Link>
          ))}
          {(!active || active.length === 0) && (
            <div className="glass-card col-span-2 text-center py-16 text-muted-foreground text-sm">No active markets</div>
          )}
        </div>
      )}

      {tab === "resolved" && (
        <div className="animate-fade-up">
          <div className="grid grid-cols-2 gap-3">
            {accumulated.map((m) => (
              <Link key={m.id} href={`/markets/${m.id}`}>
                <div className="glass-card p-5 cursor-pointer h-full hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-foreground tracking-tight">{m.asset}</span>
                      <span className="text-[9px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{m.window}</span>
                    </div>
                    <span className={`text-sm font-bold ${m.outcome === "up" ? "text-primary" : "text-destructive"}`}>
                      {m.outcome?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                    <span>Open <span className="text-foreground font-semibold">{formatPrice(m.open_price)}</span></span>
                    {m.resolve_price != null && <span>Close <span className="text-foreground font-semibold">{formatPrice(m.resolve_price)}</span></span>}
                    <span><span className="text-foreground font-semibold">{m.stats.total_orders}</span> orders</span>
                    <span><span className="text-foreground font-semibold">{formatNumber(m.stats.total_tickets_matched)}</span> matched</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {accumulated.length === 0 && (
            <div className="glass-card text-center py-16 text-muted-foreground text-sm">
              {selectedDate ? `No resolved markets for ${selectedDate}` : "No resolved markets found"}
            </div>
          )}
          {resolved?.pagination?.has_more && (
            <button
              onClick={() => setOffset((o) => o + limit)}
              className="w-full mt-4 py-2.5 text-[12px] font-semibold text-primary border border-primary/30 hover:bg-primary hover:text-white transition-colors rounded-xl"
            >
              Load More
            </button>
          )}
        </div>
      )}
    </div>
  );
}
