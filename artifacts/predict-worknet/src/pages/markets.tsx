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
    <span className={`font-mono text-[11px] font-medium tracking-wide ${isClosed ? "text-foreground/30" : "text-foreground"}`}>
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
    <div className="animate-fade-up">
      <div className="flex items-baseline justify-between mb-10">
        <h1 className="font-serif-editorial text-[48px] tracking-[-0.03em] text-foreground leading-[1]">Markets</h1>
        <div className="flex items-center gap-4">
          <div className="flex gap-0">
            <button
              onClick={() => setTab("active")}
              className={`px-4 py-1.5 text-[12px] tracking-[0.02em] transition-colors ${
                tab === "active"
                  ? "text-foreground font-medium border-b-2 border-foreground"
                  : "text-foreground/30 font-light hover:text-foreground/60"
              }`}
            >
              Active ({active?.length ?? 0})
            </button>
            <button
              onClick={() => { setTab("resolved"); setOffset(0); setAccumulated([]); }}
              className={`px-4 py-1.5 text-[12px] tracking-[0.02em] transition-colors ${
                tab === "resolved"
                  ? "text-foreground font-medium border-b-2 border-foreground"
                  : "text-foreground/30 font-light hover:text-foreground/60"
              }`}
            >
              Resolved
            </button>
          </div>

          {tab === "resolved" && (
            <>
              <div className="flex items-center gap-0.5">
                {last7.map((d) => {
                  const isSelected = d.date === selectedDate;
                  return (
                    <button
                      key={d.date}
                      onClick={() => setSelectedDate(isSelected ? "" : d.date)}
                      className={`flex flex-col items-center w-9 py-1 text-center transition-colors ${
                        isSelected
                          ? "text-foreground border-b-2 border-foreground"
                          : "text-foreground/25 hover:text-foreground/50"
                      }`}
                    >
                      <span className="text-[8px] font-light tracking-wider">{d.dayLabel}</span>
                      <span className="text-[12px] font-light leading-tight">{d.label}</span>
                    </button>
                  );
                })}
              </div>
              <select
                value={asset}
                onChange={(e) => { setAsset(e.target.value); setOffset(0); setAccumulated([]); }}
                className="bg-transparent border border-border px-2.5 py-1.5 text-[11px] font-light text-foreground"
              >
                <option value="">All assets</option>
                {assets.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <select
                value={window}
                onChange={(e) => { setWindow(e.target.value); setOffset(0); setAccumulated([]); }}
                className="bg-transparent border border-border px-2.5 py-1.5 text-[11px] font-light text-foreground"
              >
                <option value="">All windows</option>
                {windows.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </>
          )}
        </div>
      </div>

      {tab === "active" && (
        <div className="border-t border-border/60">
          {active?.map((m, i) => (
            <Link key={m.id} href={`/markets/${m.id}`}>
              <div className={`py-4 flex items-center gap-6 cursor-pointer hover:bg-foreground/[0.02] transition-colors text-[12px] ${i < (active.length - 1) ? "border-b border-border/40" : ""}`}>
                <div className="flex items-baseline gap-2 w-32">
                  <span className="font-serif-editorial text-[24px] text-foreground leading-[1]">{m.asset}</span>
                  <span className="text-[10px] font-light text-foreground/25">{m.window}</span>
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-foreground font-medium">{formatPct(m.orderbook.best_up_price)}</span>
                  <div className="flex-1 h-[1px] bg-border/60 relative max-w-[200px]">
                    <div className="absolute top-0 left-0 h-full bg-foreground" style={{ width: `${m.orderbook.best_up_price * 100}%` }} />
                  </div>
                  <span className="text-foreground/30 font-light">{formatPct(m.orderbook.best_down_price)}</span>
                </div>
                <div className="flex items-center gap-6 text-foreground/30 font-light">
                  <span>Open {formatPrice(m.open_price)}</span>
                  <span>{m.stats.total_orders} orders</span>
                  <span>{formatNumber(m.stats.total_tickets_matched)} matched</span>
                </div>
                <CountdownTimer closesAt={m.close_at} />
              </div>
            </Link>
          ))}
          {(!active || active.length === 0) && (
            <div className="text-center py-16 text-foreground/20 text-[13px] font-light">No active markets</div>
          )}
        </div>
      )}

      {tab === "resolved" && (
        <div className="border-t border-border/60">
          {accumulated.map((m, i) => (
            <Link key={m.id} href={`/markets/${m.id}`}>
              <div className={`py-4 flex items-center gap-6 cursor-pointer hover:bg-foreground/[0.02] transition-colors text-[12px] ${i < (accumulated.length - 1) ? "border-b border-border/40" : ""}`}>
                <div className="flex items-baseline gap-2 w-32">
                  <span className="font-serif-editorial text-[24px] text-foreground leading-[1]">{m.asset}</span>
                  <span className="text-[10px] font-light text-foreground/25">{m.window}</span>
                </div>
                <span className={`text-[11px] font-medium tracking-[0.06em] w-12 ${m.outcome === "up" ? "text-foreground" : "text-foreground/40"}`}>
                  {m.outcome?.toUpperCase()}
                </span>
                <div className="flex items-center gap-6 text-foreground/30 font-light flex-1">
                  <span>Open {formatPrice(m.open_price)}</span>
                  {m.resolve_price != null && <span>Close {formatPrice(m.resolve_price)}</span>}
                  <span>{m.stats.total_orders} orders</span>
                  <span>{formatNumber(m.stats.total_tickets_matched)} matched</span>
                </div>
              </div>
            </Link>
          ))}
          {accumulated.length === 0 && (
            <div className="text-center py-16 text-foreground/20 text-[13px] font-light">
              {selectedDate ? `No resolved markets for ${selectedDate}` : "No resolved markets found"}
            </div>
          )}
          {resolved?.pagination?.has_more && (
            <button
              onClick={() => setOffset((o) => o + limit)}
              className="w-full mt-6 py-2.5 text-[12px] font-light text-foreground border-t border-border/60 hover:bg-foreground/[0.02] transition-colors tracking-[0.04em]"
            >
              Load more
            </button>
          )}
        </div>
      )}
    </div>
  );
}
