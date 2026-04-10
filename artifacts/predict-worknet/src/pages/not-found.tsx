export default function NotFound() {
  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center">
      <div className="border border-border rounded p-8 bg-card text-center max-w-md">
        <div className="text-4xl font-mono font-bold text-primary mb-2">404</div>
        <div className="text-sm font-mono text-foreground mb-4">Page Not Found</div>
        <p className="text-xs font-mono text-muted-foreground">
          The requested route does not exist in this terminal.
        </p>
      </div>
    </div>
  );
}
