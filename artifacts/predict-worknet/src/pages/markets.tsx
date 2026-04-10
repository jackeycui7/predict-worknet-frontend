import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "wouter";
import {
  useGetActiveMarkets,
  useGetResolvedMarkets,
  getGetActiveMarketsQueryKey,
  getGetResolvedMarketsQueryKey,
} from "@workspace/api-client-react";
import type { MarketItem } from "@workspace/api-client-react";
import { formatPct, formatPrice, countdownStr } from "@/lib/format";

function CountdownTimer({ closesAt }: { closesAt: string }) {
  const [display, setDisplay] = useState(countdownStr(closesAt));
  useEffect(() => {
    const id = setInterval(() => setDisplay(countdownStr(closesAt)), 1000);
    return () => clearInterval(id);
  }, [closesAt]);
  const isClosed = display === "CLOSED";
  return (
    <span className={`font-mono text-xs ${isClosed ? "text-destructive" : "text-primary"}`} data-testid="countdown">
      {display}
    </span>
  );
}

export default function Markets() {
  const [tab, setTab] = useState<"active" | "resolved">("active");
  const [asset, setAsset] = useState("");
  const [window, setWindow] = useState("");
  const [offset, setOffset] = useState(0);
  const [accumulated, setAccumulated] = useState<MarketItem[]>([]);
  const filterKey = useRef("");
  const limit = 20;

  const { data: active } = useGetActiveMarkets({ query: { refetchInterval: 15000, queryKey: getGetActiveMarketsQueryKey() } });
  const { data: resolved } = useGetResolvedMarkets(
    { limit, offset, asset: asset || undefined, window: window || undefined },
    { query: { enabled: tab === "resolved", queryKey: getGetResolvedMarketsQueryKey({ limit, offset, asset: asset || undefined, window: window || undefined }) } }
  );

  const currentFilterKey = `${asset}-${window}`;
  useEffect(() => {
    if (currentFilterKey !== filterKey.current) {
      filterKey.current = currentFilterKey;
      setAccumulated([]);
      setOffset(0);
    }
  }, [currentFilterKey]);

  useEffect(() => {
    if (resolved?.data) {
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
  }, [resolved?.data, offset]);

  const resetFilters = useCallback((newAsset: string, newWindow: string) => {
    setAsset(newAsset);
    setWindow(newWindow);
    setOffset(0);
    setAccumulated([]);
  }, []);

  const assets = ["BTC", "ETH", "SOL", "BNB", "DOGE"];
  const windows = ["15m", "30m", "1h"];

  return (
    <div className="p-6 space-y-6" data-testid="markets-page">
      <h1 className="text-xl font-mono font-bold text-foreground">Markets</h1>

      <div className="flex gap-2">
        <button
          onClick={() => setTab("active")}
          className={`px-4 py-2 rounded text-xs font-mono ${tab === "active" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
          data-testid="tab-active"
        >
          Active ({active?.length ?? 0})
        </button>
        <button
          onClick={() => { setTab("resolved"); setOffset(0); setAccumulated([]); }}
          className={`px-4 py-2 rounded text-xs font-mono ${tab === "resolved" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
          data-testid="tab-resolved"
        >
          Resolved
        </button>
      </div>

      {tab === "active" && (
        <div className="space-y-2" data-testid="active-markets">
          {active?.map((m) => (
            <Link key={m.id} href={`/markets/${m.id}`}>
              <div className="border border-border rounded p-4 bg-card hover:border-primary/40 cursor-pointer transition-colors" data-testid={`market-${m.id}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-foreground">{m.asset}</span>
                    <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted">{m.window}</span>
                    <span className="text-xs font-mono text-muted-foreground">{m.id}</span>
                  </div>
                  <CountdownTimer closesAt={m.close_at} />
                </div>
                <div className="flex items-center gap-6 text-xs font-mono">
                  <div>
                    <span className="text-muted-foreground">Open: </span>
                    <span className="text-foreground">{formatPrice(m.open_price)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Predictions: </span>
                    <span className="text-foreground">{m.stats.total_predictions}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-primary">{formatPct(m.amm.up_price)} UP</span>
                    <div className="flex-1 h-2 bg-destructive/30 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${m.amm.up_price * 100}%` }} />
                    </div>
                    <span className="text-destructive">{formatPct(m.amm.down_price)} DN</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {(!active || active.length === 0) && (
            <div className="text-center py-8 text-muted-foreground font-mono text-sm">No active markets</div>
          )}
        </div>
      )}

      {tab === "resolved" && (
        <div className="space-y-4">
          <div className="flex gap-2" data-testid="resolved-filters">
            <select
              value={asset}
              onChange={(e) => resetFilters(e.target.value, window)}
              className="bg-card border border-border rounded px-3 py-1.5 text-xs font-mono text-foreground"
              data-testid="filter-asset"
            >
              <option value="">All Assets</option>
              {assets.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <select
              value={window}
              onChange={(e) => resetFilters(asset, e.target.value)}
              className="bg-card border border-border rounded px-3 py-1.5 text-xs font-mono text-foreground"
              data-testid="filter-window"
            >
              <option value="">All Windows</option>
              {windows.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div className="space-y-2" data-testid="resolved-markets">
            {accumulated.map((m) => (
              <Link key={m.id} href={`/markets/${m.id}`}>
                <div className="border border-border rounded p-4 bg-card hover:border-primary/40 cursor-pointer transition-colors" data-testid={`market-${m.id}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-foreground">{m.asset}</span>
                      <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted">{m.window}</span>
                    </div>
                    <span className={`text-xs font-mono font-bold ${m.outcome === "up" ? "text-primary" : "text-destructive"}`}>
                      {m.outcome?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-xs font-mono">
                    <div><span className="text-muted-foreground">Open: </span><span>{formatPrice(m.open_price)}</span></div>
                    {m.resolve_price != null && <div><span className="text-muted-foreground">Close: </span><span>{formatPrice(m.resolve_price)}</span></div>}
                    <div><span className="text-muted-foreground">Predictions: </span><span>{m.stats.total_predictions}</span></div>
                    <div><span className="text-muted-foreground">Correct: </span><span>{m.stats.correct_count ?? 0}/{m.stats.total_predictions}</span></div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {resolved?.pagination?.has_more && (
            <button
              onClick={() => setOffset((o) => o + limit)}
              className="w-full py-2 text-xs font-mono text-primary border border-border rounded hover:bg-muted/50"
              data-testid="load-more-resolved"
            >
              Load More
            </button>
          )}
        </div>
      )}
    </div>
  );
}
