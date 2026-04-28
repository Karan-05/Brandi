import type { ClassifyApiSuccess, Category } from "@/lib/types";
import { CATEGORY_VALUES } from "@/lib/types";

const categoryStyles: Record<Category, { bar: string; text: string; bg: string }> = {
  Ecommerce: { bar: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50" },
  "Social / UGC": { bar: "bg-sky-400", text: "text-sky-700", bg: "bg-sky-50" },
  "News / Media": { bar: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  Other: { bar: "bg-stone-400", text: "text-stone-600", bg: "bg-stone-50" },
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
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-ink/70">Session Statistics</h2>
        <span className="text-xs text-ink/40">
          {history.length} classified · {cachedCount} cached
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORY_VALUES.map((cat) => {
          const count = counts[cat];
          const pct = Math.round((count / history.length) * 100);
          const s = categoryStyles[cat];

          return (
            <div key={cat} className={`rounded-2xl border border-black/[0.06] ${s.bg} p-4`}>
              <div className="mb-3 flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-ink/60">{cat}</span>
                <span className={`text-2xl font-bold tabular-nums leading-none ${s.text}`}>{count}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.07]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${s.bar}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-1.5 text-right text-[10px] font-semibold text-ink/38">{pct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
