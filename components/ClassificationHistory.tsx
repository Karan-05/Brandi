import type { HistoryEntry } from "@/hooks/useClassificationHistory";
import type { Category } from "@/lib/types";

const badgeStyles: Record<Category, string> = {
  Ecommerce: "bg-amber-100 text-amber-800",
  "Social / UGC": "bg-sky-100 text-sky-800",
  "News / Media": "bg-emerald-100 text-emerald-800",
  Other: "bg-stone-100 text-stone-800",
};

function timeAgo(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function ClassificationHistory({
  history,
  onClear,
}: {
  history: HistoryEntry[];
  onClear: () => void;
}) {
  if (history.length === 0) return null;

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-ink/70">Recent Classifications</h2>
        <button
          onClick={onClear}
          className="text-xs text-ink/40 underline underline-offset-2 transition hover:text-ink/70"
        >
          Clear history
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {history.map((entry) => (
          <div
            key={`${entry.normalizedUrl}-${entry.classifiedAt}`}
            className="rounded-2xl border border-black/5 bg-canvas/60 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-sm font-medium text-ink/85">{getDomain(entry.normalizedUrl)}</p>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${badgeStyles[entry.category]}`}>
                {entry.category}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-ink/50">{Math.round(entry.confidence * 100)}% confidence</span>
              {entry.cached && (
                <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-xs text-stone-500">cached</span>
              )}
              <span className="ml-auto text-xs text-ink/35">{timeAgo(entry.classifiedAt)}</span>
            </div>
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-ink/50">{entry.explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
