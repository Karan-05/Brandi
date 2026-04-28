export function LoadingState() {
  return (
    <div
      aria-live="polite"
      aria-busy="true"
      className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-black/[0.06] bg-white/60 py-12"
    >
      <span className="h-7 w-7 animate-spin rounded-full border-[2.5px] border-black/[0.08] border-t-accent" />
      <p className="text-sm font-medium text-ink/45">Classifying…</p>
    </div>
  );
}
