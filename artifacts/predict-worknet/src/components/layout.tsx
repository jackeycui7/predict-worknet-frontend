import { Link, useLocation } from "wouter";
import { useHealthCheck } from "@/lib/api";

const NAV = [
  { path: "/", label: "Overview" },
  { path: "/markets", label: "Markets" },
  { path: "/leaderboard", label: "Leaderboard" },
  { path: "/epochs", label: "Epochs" },
  { path: "/highlights", label: "Highlights" },
  { path: "/rewards", label: "Rewards" },
  { path: "/docs", label: "Docs" },
  { path: "/blog", label: "Blog" },
  { path: "/join", label: "Join" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: health } = useHealthCheck();
  const isLive = health?.status === "ok";

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 z-0 bg-grid pointer-events-none" />

      <FloatingDecorations />

      <header className="relative z-10 border-b border-border/60">
        <div className="flex items-center justify-between px-8 h-14 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/">
              <span className="cursor-pointer flex items-baseline gap-2">
                <span className="text-[13px] font-medium tracking-[-0.01em] text-foreground">Predict WorkNet</span>
                <span className="text-[10px] font-light text-foreground/30 tracking-[0.06em]">built on AWP</span>
              </span>
            </Link>
          </div>
          <nav className="flex items-center gap-0">
            {NAV.map(({ path, label }) => {
              const active = path === "/" ? location === "/" : location.startsWith(path);
              return (
                <Link key={path} href={path}>
                  <span
                    className={`px-4 py-1.5 text-[12px] tracking-[0.02em] cursor-pointer transition-all duration-200 ${
                      active
                        ? "text-foreground font-medium"
                        : "text-foreground/30 hover:text-foreground/60 font-light"
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
            <div className="flex items-center gap-1.5 ml-4 pl-4 border-l border-border/40">
              <span className={`w-[5px] h-[5px] rounded-full ${isLive ? "bg-foreground/40 animate-pulse-live" : "bg-red-400"}`} />
              <span className="text-[10px] font-light text-foreground/30 tracking-[0.06em]">
                {isLive ? "Live" : "Offline"}
              </span>
            </div>
          </nav>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-[1440px] px-8 py-10">
        {children}
      </main>
    </div>
  );
}

function FloatingDecorations() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[15%] left-[8%] w-8 h-8 animate-float-medium opacity-[0.04]" style={{ animationDelay: "100ms" }}>
        <svg viewBox="0 0 12 12" className="w-full h-full" style={{ imageRendering: "pixelated" }}>
          <rect x="4" y="0" width="4" height="4" fill="#111" />
          <rect x="0" y="4" width="4" height="4" fill="#111" />
          <rect x="8" y="4" width="4" height="4" fill="#111" />
          <rect x="4" y="8" width="4" height="4" fill="#111" />
        </svg>
      </div>
      <div className="absolute top-[8%] left-[30%] w-5 h-5 animate-float-slow opacity-[0.03]" style={{ animationDelay: "500ms" }}>
        <svg viewBox="0 0 8 8" className="w-full h-full" style={{ imageRendering: "pixelated" }}>
          <rect x="0" y="0" width="4" height="4" fill="#111" />
          <rect x="4" y="4" width="4" height="4" fill="#111" />
        </svg>
      </div>
      <div className="absolute top-[22%] right-[12%] w-6 h-6 animate-float-fast opacity-[0.035]" style={{ animationDelay: "300ms" }}>
        <svg viewBox="0 0 12 12" className="w-full h-full" style={{ imageRendering: "pixelated" }}>
          <rect x="4" y="0" width="4" height="4" fill="#111" />
          <rect x="0" y="4" width="4" height="4" fill="#111" />
          <rect x="8" y="4" width="4" height="4" fill="#111" />
          <rect x="4" y="8" width="4" height="4" fill="#111" />
        </svg>
      </div>
      <div className="absolute bottom-[25%] left-[18%] w-4 h-4 animate-float-slow opacity-[0.03]" style={{ animationDelay: "700ms" }}>
        <svg viewBox="0 0 8 8" className="w-full h-full" style={{ imageRendering: "pixelated" }}>
          <rect x="0" y="0" width="8" height="4" fill="#111" />
          <rect x="2" y="4" width="4" height="4" fill="#111" />
        </svg>
      </div>
      <div className="absolute bottom-[30%] right-[20%] w-7 h-7 animate-float-medium opacity-[0.025]" style={{ animationDelay: "1000ms" }}>
        <svg viewBox="0 0 12 12" className="w-full h-full" style={{ imageRendering: "pixelated" }}>
          <rect x="4" y="0" width="4" height="4" fill="#111" />
          <rect x="0" y="4" width="4" height="4" fill="#111" />
          <rect x="8" y="4" width="4" height="4" fill="#111" />
          <rect x="4" y="8" width="4" height="4" fill="#111" />
        </svg>
      </div>
    </div>
  );
}
