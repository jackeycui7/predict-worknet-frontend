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
      <header className="border-b border-border/60 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center justify-between px-8 h-14 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-5">
            <Link href="/">
              <span className="cursor-pointer flex items-baseline gap-2">
                <span className="text-[15px] font-bold tracking-tight text-foreground">Predict WorkNet</span>
                <span className="text-[10px] font-medium text-muted-foreground tracking-wide">built on AWP</span>
              </span>
            </Link>
            <div className="flex items-center gap-1.5 ml-2">
              <span className={`w-[6px] h-[6px] rounded-full ${isLive ? "bg-emerald-500 animate-pulse-live" : "bg-red-400"}`} />
              <span className="text-[10px] font-medium text-muted-foreground tracking-wide">
                {isLive ? "LIVE" : "OFFLINE"}
              </span>
            </div>
          </div>
          <nav className="flex items-center gap-0.5">
            {NAV.map(({ path, label }) => {
              const active = path === "/" ? location === "/" : location.startsWith(path);
              return (
                <Link key={path} href={path}>
                  <span
                    className={`px-3 py-1.5 text-[13px] font-medium cursor-pointer transition-all duration-200 ${
                      active
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px]">
        {children}
      </main>
    </div>
  );
}
