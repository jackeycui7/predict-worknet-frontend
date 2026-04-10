import { useState, useEffect, useCallback, useRef } from "react";
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
    <span className={`font-mono text-xs font-semibold ${isClosed ? "text-destructive" : "text-primary"}`}>
      {display}
    </span>
  );
}

function buildCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

function MiniCalendar({ selectedDate, onSelect }: { selectedDate: string; onSelect: (d: string) => void }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const days = buildCalendarDays(viewYear, viewMonth);
  const monthLabel = new Date(viewYear, viewMonth).toLocaleString("en-US", { month: "long", year: "numeric" });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  };

  const todayStr = now.toISOString().slice(0, 10);
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="border border-border/60 bg-white p-4 w-[260px]">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="text-muted-foreground hover:text-foreground text-sm px-1">←</button>
        <span className="text-xs font-semibold text-foreground">{monthLabel}</span>
        <button onClick={nextMonth} className="text-muted-foreground hover:text-foreground text-sm px-1">→</button>
      </div>
      <div className="grid grid-cols-7 gap-0">
        {weekDays.map((w) => (
          <div key={w} className="text-center text-[10px] text-muted-foreground py-1 font-medium">{w}</div>
        ))}
        {days.map((d, i) => {
          if (d === null) return <div key={`e-${i}`} />;
          const dateStr = `${viewYear}-${(viewMonth + 1).toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const isFuture = dateStr > todayStr;
          return (
            <button
              key={dateStr}
              onClick={() => !isFuture && onSelect(isSelected ? "" : dateStr)}
              disabled={isFuture}
              className={`text-center py-1.5 text-xs transition-colors ${
                isSelected ? "bg-primary text-white font-semibold" :
                isToday ? "text-primary font-semibold" :
                isFuture ? "text-muted-foreground/30 cursor-not-allowed" :
                "text-foreground hover:bg-muted/50"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
      {selectedDate && (
        <button
          onClick={() => onSelect("")}
          className="mt-2 text-[11px] text-primary hover:underline w-full text-center"
        >
          Clear date filter
        </button>
      )}
    </div>
  );
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
      if (offset === 0) {
        setAccumulated(resolved.data);
      } else {
        setAccumulated((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newItems = resolved.data.filter((m) => !existingIds.has(m.id));
          return [...prev, ...newItems];
        });
      }
    }
  }, [resolved?.data, offset, tab]);

  const assets = ["BTC", "ETH", "SOL", "BNB", "DOGE"];
  const windows = ["15m", "30m", "1h"];

  return (
    <div className="px-8 py-8 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Markets</h1>
          <p className="text-sm text-muted-foreground mt-1">Active and resolved prediction markets</p>
        </div>
        <div className="flex gap-0 border-b border-border/40">
          <button
            onClick={() => setTab("active")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "active" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            Active ({active?.length ?? 0})
          </button>
          <button
            onClick={() => { setTab("resolved"); setOffset(0); setAccumulated([]); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "resolved" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            Resolved
          </button>
        </div>
      </div>

      {tab === "active" && (
        <div className="space-y-3 animate-fade-up">
          {active?.map((m) => (
            <Link key={m.id} href={`/markets/${m.id}`}>
              <div className="border border-border/60 bg-white p-5 hover:border-primary/40 cursor-pointer transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-foreground">{m.asset}</span>
                    <span className="text-[10px] font-medium text-muted-foreground px-2 py-0.5 bg-muted">{m.window}</span>
                    <span className="text-xs font-mono text-muted-foreground/60">{m.id}</span>
                  </div>
                  <CountdownTimer closesAt={m.close_at} />
                </div>
                <div className="flex items-center gap-8 text-[12px]">
                  <div>
                    <span className="text-muted-foreground">Open </span>
                    <span className="text-foreground font-semibold">{formatPrice(m.open_price)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Orders </span>
                    <span className="text-foreground font-semibold">{m.stats.total_orders}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Matched </span>
                    <span className="text-foreground font-semibold">{formatNumber(m.stats.total_tickets_matched)} tix</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-primary font-semibold">{formatPct(m.orderbook.best_up_price)}</span>
                    <div className="flex-1 h-[3px] bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${m.orderbook.best_up_price * 100}%` }} />
                    </div>
                    <span className="text-destructive font-semibold">{formatPct(m.orderbook.best_down_price)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {(!active || active.length === 0) && (
            <div className="text-center py-12 text-muted-foreground text-sm">No active markets</div>
          )}
        </div>
      )}

      {tab === "resolved" && (
        <div className="grid grid-cols-[260px_1fr] gap-6">
          <div className="space-y-4">
            <MiniCalendar selectedDate={selectedDate} onSelect={setSelectedDate} />
            <div className="space-y-2">
              <select
                value={asset}
                onChange={(e) => { setAsset(e.target.value); setOffset(0); setAccumulated([]); }}
                className="w-full bg-white border border-border/60 px-3 py-2 text-sm text-foreground"
              >
                <option value="">All Assets</option>
                {assets.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <select
                value={window}
                onChange={(e) => { setWindow(e.target.value); setOffset(0); setAccumulated([]); }}
                className="w-full bg-white border border-border/60 px-3 py-2 text-sm text-foreground"
              >
                <option value="">All Windows</option>
                {windows.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-3">
            {accumulated.map((m) => (
              <Link key={m.id} href={`/markets/${m.id}`}>
                <div className="border border-border/60 bg-white p-5 hover:border-primary/40 cursor-pointer transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-foreground">{m.asset}</span>
                      <span className="text-[10px] font-medium text-muted-foreground px-2 py-0.5 bg-muted">{m.window}</span>
                    </div>
                    <span className={`text-sm font-semibold ${m.outcome === "up" ? "text-primary" : "text-destructive"}`}>
                      {m.outcome?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-8 text-[12px]">
                    <div><span className="text-muted-foreground">Open </span><span className="font-semibold">{formatPrice(m.open_price)}</span></div>
                    {m.resolve_price != null && <div><span className="text-muted-foreground">Close </span><span className="font-semibold">{formatPrice(m.resolve_price)}</span></div>}
                    <div><span className="text-muted-foreground">Orders </span><span className="font-semibold">{m.stats.total_orders}</span></div>
                    <div><span className="text-muted-foreground">Matched </span><span className="font-semibold">{formatNumber(m.stats.total_tickets_matched)} tix</span></div>
                  </div>
                </div>
              </Link>
            ))}
            {accumulated.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                {selectedDate ? `No resolved markets for ${selectedDate}` : "No resolved markets found"}
              </div>
            )}
            {resolved?.pagination?.has_more && (
              <button
                onClick={() => setOffset((o) => o + limit)}
                className="w-full py-2.5 text-sm font-medium text-primary border border-primary hover:bg-primary hover:text-white transition-colors"
              >
                Load More
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
