export function NowShowingBadge() {
  return (
    <div className="inline-flex select-none items-center gap-2 rounded-full border border-border/80 bg-background/70 px-3 py-1 text-sm text-muted-foreground shadow-sm shadow-black/5 ring-1 ring-border/40 backdrop-blur-md">
      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
      <span>Now Showing: Interstellar In IMAX</span>
    </div>
  );
}
