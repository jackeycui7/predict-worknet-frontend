import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  BarChart3,
  Trophy,
  Clock,
  Sparkles,
} from "lucide-react";
import { useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";

const NAV = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/markets", label: "Markets", icon: BarChart3 },
  { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { path: "/epochs", label: "Epochs", icon: Clock },
  { path: "/highlights", label: "Highlights", icon: Sparkles },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: health } = useHealthCheck({ query: { refetchInterval: 30000, queryKey: getHealthCheckQueryKey(), retry: false } });

  return (
    <div className="flex min-h-screen bg-background" data-testid="app-layout">
      <aside className="w-56 shrink-0 border-r border-border bg-sidebar flex flex-col" data-testid="sidebar">
        <div className="p-4 border-b border-border">
          <Link href="/">
            <span className="font-mono text-lg font-bold text-primary tracking-tight cursor-pointer" data-testid="logo">
              Predict WorkNet
            </span>
          </Link>
          <div className="text-[10px] text-muted-foreground mt-1 font-mono">
            PREDICTION MARKET TERMINAL
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {NAV.map(({ path, label, icon: Icon }) => {
            const active =
              path === "/" ? location === "/" : location.startsWith(path);
            return (
              <Link key={path} href={path}>
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-mono cursor-pointer transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                  data-testid={`nav-${label.toLowerCase()}`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground" data-testid="api-status">
            <span className={`w-2 h-2 rounded-full ${health?.status === "ok" ? "bg-primary animate-pulse-green" : "bg-destructive"}`} />
            {health?.status === "ok" ? "LIVE" : "OFFLINE"}
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto" data-testid="main-content">
        {children}
      </main>
    </div>
  );
}
