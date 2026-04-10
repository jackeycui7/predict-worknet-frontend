import { Link, useLocation } from "wouter";
import { useHealthCheck } from "@/lib/api";

const NAV = [
  { path: "/", label: "OVERVIEW" },
  { path: "/markets", label: "MARKETS" },
  { path: "/leaderboard", label: "LEADERBOARD" },
  { path: "/epochs", label: "EPOCHS" },
  { path: "/highlights", label: "HIGHLIGHTS" },
  { path: "/rewards", label: "REWARDS" },
  { path: "/join", label: "JOIN" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: health } = useHealthCheck();
  const isLive = health?.status === "ok";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 h-12 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/">
              <span className="cursor-pointer flex items-baseline gap-2">
                <span className="text-[13px] font-bold tracking-tight text-foreground uppercase">Predict WorkNet</span>
                <span className="text-[9px] font-medium text-muted-foreground tracking-[0.12em] uppercase">Built on AWP</span>
              </span>
            </Link>
          </div>
          <nav className="flex items-center gap-0">
            {NAV.map(({ path, label }) => {
              const active = path === "/" ? location === "/" : location.startsWith(path);
              return (
                <Link key={path} href={path}>
                  <span
                    className={`px-3.5 py-1 text-[11px] font-medium tracking-[0.04em] cursor-pointer transition-all duration-150 border border-transparent ${
                      active
                        ? "bg-foreground text-white"
                        : "text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
            <div className="flex items-center gap-1.5 ml-4 pl-4 border-l border-border">
              <span className={`w-[5px] h-[5px] rounded-full ${isLive ? "bg-emerald-500 animate-pulse-live" : "bg-red-400"}`} />
              <span className="text-[9px] font-semibold text-muted-foreground tracking-[0.1em] uppercase">
                {isLive ? "LIVE" : "OFFLINE"}
              </span>
            </div>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[1440px]">
        {children}
      </main>
    </div>
  );
}
