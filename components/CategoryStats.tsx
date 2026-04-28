import type { ClassifyApiSuccess, Category } from "@/lib/types";
import { CATEGORY_VALUES } from "@/lib/types";

const categoryBarColor: Record<Category, string> = {
  Ecommerce: "bg-amber-400",
  "Social / UGC": "bg-sky-400",
  "News / Media": "bg-emerald-400",
  Other: "bg-stone-400",
};

export function CategoryStats({ history }: { history: ClassifyApiSuccess[] }) {
  if (history.length === 0) return null;

  const counts = CATEGORY_VALUES.reduce(
    (acc, cat) => {
      acc[cat] = history.filter((r) => r.category === cat).length;
      return acc;
    },
    {} as Record<Category, number>,
  );

  const cachedCount = history.filter((r) => r.cached).length;

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-ink/70">Session Statistics</h2>
        <span className="text-xs text-ink/45">
          {history.length} classification{history.length !== 1 ? "s" : ""} · {cachedCount} cached
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORY_VALUES.map((cat) => {
          const count = counts[cat];
          const pct = Math.round((count / history.length) * 100);
          return (
            <div key={cat} className="rounded-2xl border border-black/5 bg-canvas/60 p-3">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-xs font-medium text-ink/60">{cat}</span>
                <span className="text-sm font-semibold text-ink">{count}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${categoryBarColor[cat]}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-1 text-right text-xs text-ink/40">{pct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
