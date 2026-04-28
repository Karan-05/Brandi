export function LoadingState() {
  return (
    <div
      aria-live="polite"
      aria-busy="true"
      className="rounded-3xl border border-black/5 bg-mist/70 p-5"
    >
      <div className="space-y-4 animate-pulse">
        <div className="h-3 w-28 rounded-full bg-ink/10" />
        <div className="h-8 w-40 rounded-2xl bg-ink/10" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded-full bg-ink/10" />
          <div className="h-3 w-11/12 rounded-full bg-ink/10" />
          <div className="h-3 w-10/12 rounded-full bg-ink/10" />
        </div>
      </div>
      <p className="mt-4 text-sm text-ink/60">Scraping and classifying the page…</p>
    </div>
  );
}
