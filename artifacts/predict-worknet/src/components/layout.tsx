import { Link, useLocation } from "wouter";
import { useHealthCheck } from "@/lib/api";

const NAV = [
  { path: "/", label: "Overview" },
  { path: "/markets", label: "Markets" },
  { path: "/leaderboard", label: "Leaderboard" },
  { path: "/epochs", label: "Epochs" },
  { path: "/highlights", label: "Highlights" },
  { path: "/rewards", label: "Rewards" },
  { path: "/join", label: "Join" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: health } = useHealthCheck();
  const isLive = health?.status === "ok";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-white/40">
        <div className="flex items-center justify-between px-6 h-14 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/">
              <span className="cursor-pointer flex items-baseline gap-2">
                <span className="text-[14px] font-bold tracking-[-0.01em] text-foreground">Predict WorkNet</span>
                <span className="text-[10px] font-medium text-muted-foreground/60 tracking-[0.04em]">built on AWP</span>
              </span>
            </Link>
          </div>
          <nav className="flex items-center gap-1">
            {NAV.map(({ path, label }) => {
              const active = path === "/" ? location === "/" : location.startsWith(path);
              return (
                <Link key={path} href={path}>
                  <span
                    className={`px-3.5 py-1.5 text-[13px] font-medium cursor-pointer transition-all duration-200 rounded-full ${
                      active
                        ? "bg-foreground text-white"
                        : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04]"
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
            <div className="flex items-center gap-1.5 ml-3 pl-3 border-l border-border/50">
              <span className={`w-[6px] h-[6px] rounded-full ${isLive ? "bg-emerald-500 animate-pulse-live" : "bg-red-400"}`} />
              <span className="text-[11px] font-medium text-muted-foreground">
                {isLive ? "Live" : "Offline"}
              </span>
            </div>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] px-6 py-6">
        {children}
      </main>
    </div>
  );
}
