export default function NotFound() {
  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center">
      <div className="text-center">
        <div className="text-8xl font-black text-foreground/5 tracking-tight uppercase">404</div>
        <div className="text-[11px] text-muted-foreground tracking-[0.1em] uppercase mt-2">Page not found</div>
      </div>
    </div>
  );
}
