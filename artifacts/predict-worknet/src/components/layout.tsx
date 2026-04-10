import { Link, useLocation } from "wouter";
import { useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";

const NAV = [
  { path: "/", label: "Dashboard" },
  { path: "/markets", label: "Markets" },
  { path: "/leaderboard", label: "Leaderboard" },
  { path: "/epochs", label: "Epochs" },
  { path: "/highlights", label: "Highlights" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: health } = useHealthCheck({ query: { refetchInterval: 30000, queryKey: getHealthCheckQueryKey(), retry: false } });
  const isLive = health?.status === "ok";

  return (
    <div className="min-h-screen bg-background" data-testid="app-layout">
      <header className="border-b border-border bg-card sticky top-0 z-50" data-testid="header">
        <div className="flex items-center justify-between px-6 h-12">
          <div className="flex items-center gap-6">
            <Link href="/">
              <span className="text-sm font-mono font-bold text-primary tracking-tight cursor-pointer uppercase" data-testid="logo">
                PWN_SYS
              </span>
            </Link>
            <div className="flex items-center gap-1.5" data-testid="api-status">
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-green-500 animate-pulse-live" : "bg-destructive"}`} />
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                {isLive ? "Live Data" : "Offline"}
              </span>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            {NAV.map(({ path, label }) => {
              const active = path === "/" ? location === "/" : location.startsWith(path);
              return (
                <Link key={path} href={path}>
                  <span
                    className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider cursor-pointer transition-colors ${
                      active
                        ? "text-primary font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    data-testid={`nav-${label.toLowerCase()}`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px]" data-testid="main-content">
        {children}
      </main>
    </div>
  );
}
