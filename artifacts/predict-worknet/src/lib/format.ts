export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

export function formatPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

export function formatChips(v: number): string {
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return v.toFixed(0);
}

export function formatPred(v: number): string {
  return `${formatNumber(Math.round(v))} $PRED`;
}

export function formatPrice(v: number): string {
  if (v >= 1000) return `$${formatNumber(Math.round(v * 100) / 100)}`;
  return `$${v.toFixed(4)}`;
}

export function truncateAddress(addr: string): string {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function countdownStr(closesAt: string): string {
  const diff = new Date(closesAt).getTime() - Date.now();
  if (diff <= 0) return "CLOSED";
  const totalSec = Math.floor(diff / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function personaLabel(p: string): string {
  return p
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function rankChange(v: number): string {
  if (v > 0) return `+${v}`;
  if (v < 0) return `${v}`;
  return "=";
}
