import type { ClassifyApiSuccess, Category } from "@/lib/types";

type ResultCardProps = {
  result: ClassifyApiSuccess;
};

const badgeStyles: Record<Category, string> = {
  Ecommerce: "bg-amber-100 text-amber-900 border-amber-200",
  "Social / UGC": "bg-sky-100 text-sky-900 border-sky-200",
  "News / Media": "bg-emerald-100 text-emerald-900 border-emerald-200",
  Other: "bg-stone-100 text-stone-900 border-stone-200",
};

const confidenceBarColor: Record<Category, string> = {
  Ecommerce: "bg-amber-400",
  "Social / UGC": "bg-sky-400",
  "News / Media": "bg-emerald-400",
  Other: "bg-stone-400",
};

export function ResultCard({ result }: ResultCardProps) {
  const confidencePct = Math.round(result.confidence * 100);
  const timing = result.timingMs;

  return (
    <article className="rounded-3xl border border-black/5 bg-canvas/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">Detected category</p>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${
                badgeStyles[result.category]
              }`}
            >
              {result.category}
            </span>
            <span className="text-sm text-ink/55">{confidencePct}% confidence</span>
          </div>
        </div>
        <span className="rounded-full border border-black/5 bg-white px-3 py-1 text-xs font-medium text-ink/65">
          {result.cached ? "Served from cache" : "Fresh result"}
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/45">Confidence</span>
          <span className="text-xs font-medium text-ink/55">{confidencePct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-black/5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${confidenceBarColor[result.category]}`}
            style={{ width: `${confidencePct}%` }}
          />
        </div>
      </div>

      <dl className="mt-5 space-y-4">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/45">Submitted URL</dt>
          <dd className="mt-1 break-all text-sm leading-6 text-ink/80">{result.submittedUrl}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/45">Normalized URL</dt>
          <dd className="mt-1 break-all text-sm leading-6 text-ink/80">{result.normalizedUrl}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/45">Why this category</dt>
          <dd className="mt-1 text-sm leading-6 text-ink/80">{result.explanation}</dd>
        </div>
        {timing && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/45">Timing</dt>
            <dd className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink/55">
              <span>Scrape: {timing.scrape} ms</span>
              <span>Classify: {timing.classify} ms</span>
              <span className="font-medium text-ink/70">Total: {timing.total} ms</span>
            </dd>
          </div>
        )}
      </dl>
    </article>
  );
}
