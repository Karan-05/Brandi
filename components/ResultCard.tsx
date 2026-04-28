import type { ClassifyApiSuccess, Category } from "@/lib/types";

type ResultCardProps = {
  result: ClassifyApiSuccess;
};

const headerStyles: Record<
  Category,
  { bg: string; dot: string; text: string; subtext: string; border: string; bar: string }
> = {
  Ecommerce: {
    bg: "bg-amber-50",
    dot: "bg-amber-400",
    text: "text-amber-900",
    subtext: "text-amber-700/70",
    border: "border-amber-100",
    bar: "bg-amber-400",
  },
  "Social / UGC": {
    bg: "bg-sky-50",
    dot: "bg-sky-400",
    text: "text-sky-900",
    subtext: "text-sky-700/70",
    border: "border-sky-100",
    bar: "bg-sky-400",
  },
  "News / Media": {
    bg: "bg-emerald-50",
    dot: "bg-emerald-500",
    text: "text-emerald-900",
    subtext: "text-emerald-700/70",
    border: "border-emerald-100",
    bar: "bg-emerald-500",
  },
  Other: {
    bg: "bg-stone-50",
    dot: "bg-stone-400",
    text: "text-stone-900",
    subtext: "text-stone-600/70",
    border: "border-stone-200",
    bar: "bg-stone-400",
  },
};

export function ResultCard({ result }: ResultCardProps) {
  const confidencePct = Math.round(result.confidence * 100);
  const timing = result.timingMs;
  const s = headerStyles[result.category];

  return (
    <article className="animate-fade-in-up overflow-hidden rounded-3xl border border-black/[0.07] bg-white shadow-sm">
      <div className={`${s.bg} border-b ${s.border} px-6 py-5`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
            <span className={`text-sm font-semibold tracking-wide ${s.text}`}>{result.category}</span>
          </div>
          <div className="flex items-center gap-2">
            {result.reclassified && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700">
                Re-classified
              </span>
            )}
            <span className="rounded-full border border-black/[0.07] bg-white/80 px-3 py-0.5 text-[11px] font-medium text-ink/55">
              {result.cached ? "Cached" : "Fresh"}
            </span>
          </div>
        </div>

        <div className="mt-5 flex items-end gap-1.5">
          <span className={`text-[3.25rem] font-bold tabular-nums leading-none ${s.text}`}>{confidencePct}</span>
          <span className={`mb-1 text-xl font-semibold ${s.subtext}`}>%</span>
          <span className="mb-1 ml-1 text-sm text-ink/45">confidence</span>
        </div>

        <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.07]">
          <div
            className={`h-full rounded-full transition-all duration-700 ${s.bar}`}
            style={{ width: `${confidencePct}%` }}
          />
        </div>
      </div>

      <div className="px-6 py-5">
        <dl className="space-y-5">
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/38">Why this category</dt>
            <dd className="mt-2 text-sm leading-6 text-ink/80">{result.explanation}</dd>
          </div>

          <div className="grid gap-4 border-t border-black/[0.06] pt-5 sm:grid-cols-2">
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/38">Submitted URL</dt>
              <dd className="mt-1.5 break-all text-sm leading-5 text-ink/60">{result.submittedUrl}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/38">Normalized URL</dt>
              <dd className="mt-1.5 break-all text-sm leading-5 text-ink/60">{result.normalizedUrl}</dd>
            </div>
          </div>

          {timing && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-black/[0.06] pt-4">
              <TimingChip label="Scrape" ms={timing.scrape} />
              <TimingChip label="LLM" ms={timing.classify} />
              <TimingChip label="Total" ms={timing.total} bold />
            </div>
          )}
        </dl>
      </div>
    </article>
  );
}

function TimingChip({ label, ms, bold }: { label: string; ms: number; bold?: boolean }) {
  const display = ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  return (
    <span className={`text-xs ${bold ? "font-semibold text-ink/65" : "text-ink/40"}`}>
      {label}: {display}
    </span>
  );
}
