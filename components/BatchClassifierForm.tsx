"use client";

import { useState } from "react";
import type { ApiKeys } from "@/hooks/useApiKeys";
import type { Category, ClassifyApiError, ClassifyApiSuccess } from "@/lib/types";

type BatchItem =
  | { status: "pending"; url: string }
  | { status: "success"; url: string; result: ClassifyApiSuccess }
  | { status: "error"; url: string; message: string };

type BatchClassifierFormProps = {
  onSuccess?: (result: ClassifyApiSuccess) => void;
  apiKeys?: ApiKeys;
};

const MAX_URLS = 15;
const CONCURRENCY = 4;

const CATEGORY_STYLES: Record<Category, { dot: string; bg: string; text: string }> = {
  Ecommerce: { dot: "bg-amber-400", bg: "bg-amber-50", text: "text-amber-800" },
  "Social / UGC": { dot: "bg-sky-400", bg: "bg-sky-50", text: "text-sky-800" },
  "News / Media": { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-800" },
  Other: { dot: "bg-stone-400", bg: "bg-stone-50", text: "text-stone-700" },
};

async function classifySingle(url: string, apiKeys?: ApiKeys): Promise<ClassifyApiSuccess> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKeys?.firecrawlKey) headers["x-firecrawl-key"] = apiKeys.firecrawlKey;
  if (apiKeys?.groqKey) headers["x-groq-key"] = apiKeys.groqKey;

  const response = await fetch("/api/classify", {
    method: "POST",
    headers,
    body: JSON.stringify({ url }),
  });

  const payload = (await response.json()) as ClassifyApiSuccess | ClassifyApiError;

  if (!response.ok || "error" in payload) {
    throw new Error("error" in payload ? payload.error.message : "Classification failed.");
  }

  return payload as ClassifyApiSuccess;
}

export function BatchClassifierForm({ onSuccess, apiKeys }: BatchClassifierFormProps) {
  const [text, setText] = useState("");
  const [items, setItems] = useState<BatchItem[]>([]);
  const [running, setRunning] = useState(false);

  const parsedUrls = [
    ...new Set(
      text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    ),
  ].slice(0, MAX_URLS);

  const rawCount = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean).length;
  const tooMany = rawCount > MAX_URLS;

  const completed = items.filter((i) => i.status !== "pending").length;
  const total = items.length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!parsedUrls.length || running) return;

    setItems(parsedUrls.map((url) => ({ status: "pending", url })));
    setRunning(true);

    let idx = 0;

    async function worker() {
      while (idx < parsedUrls.length) {
        const i = idx++;
        const url = parsedUrls[i];
        try {
          const result = await classifySingle(url, apiKeys);
          setItems((prev) =>
            prev.map((item) => (item.url === url ? { status: "success", url, result } : item)),
          );
          onSuccess?.(result);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Classification failed.";
          setItems((prev) =>
            prev.map((item) => (item.url === url ? { status: "error", url, message } : item)),
          );
        }
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, parsedUrls.length) }, worker),
    );
    setRunning(false);
  }

  const btnLabel = parsedUrls.length > 0
    ? `Classify ${parsedUrls.length} URL${parsedUrls.length !== 1 ? "s" : ""}`
    : "Classify";

  return (
    <div className="space-y-5">
      <form className="space-y-3" onSubmit={handleSubmit}>
        <label className="text-sm font-medium text-ink/75" htmlFor="batch-urls">
          Enter URLs — one per line
        </label>
        <textarea
          id="batch-urls"
          rows={6}
          placeholder={"https://amazon.com\nhttps://reddit.com\nhttps://bbc.com"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={running}
          className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 font-mono text-xs text-ink outline-none transition placeholder:text-ink/30 focus:border-accent focus:ring-4 focus:ring-accent/10 disabled:cursor-not-allowed disabled:opacity-60"
        />
        {tooMany && (
          <p className="text-[10px] text-amber-600">
            First {MAX_URLS} unique URLs will be processed.
          </p>
        )}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={running || !parsedUrls.length}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent/90 focus:outline-none focus:ring-4 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {running ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {completed} / {total} done…
              </>
            ) : (
              btnLabel
            )}
          </button>
          {items.length > 0 && !running && (
            <button
              type="button"
              onClick={() => {
                setItems([]);
                setText("");
              }}
              className="text-xs text-ink/35 underline underline-offset-2 transition hover:text-ink/65"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {items.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-black/[0.06]">
          {running && (
            <div className="border-b border-black/[0.06] bg-accent/5 px-4 py-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-accent">
                  Classifying {total} URLs…
                </span>
                <span className="text-[10px] text-ink/40">{completed} / {total}</span>
              </div>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-black/[0.07]">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-300"
                  style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
          {items.map((item, i) => (
            <BatchRow key={item.url} item={item} last={i === items.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function BatchRow({ item, last }: { item: BatchItem; last: boolean }) {
  const borderClass = last ? "" : "border-b border-black/[0.06]";

  if (item.status === "pending") {
    return (
      <div className={`flex items-center gap-3 px-4 py-3.5 ${borderClass}`}>
        <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-black/10 border-t-ink/40" />
        <span className="truncate text-xs text-ink/45">{item.url}</span>
      </div>
    );
  }

  if (item.status === "error") {
    return (
      <div className={`flex items-center gap-3 px-4 py-3.5 ${borderClass}`}>
        <span className="h-2 w-2 shrink-0 rounded-full bg-rose-400" />
        <span className="min-w-0 flex-1 truncate text-xs text-ink/50">{item.url}</span>
        <span className="shrink-0 text-[10px] text-rose-500">{item.message}</span>
      </div>
    );
  }

  const { result } = item;
  const s = CATEGORY_STYLES[result.category];
  const pct = Math.round(result.confidence * 100);

  return (
    <div className={`px-4 py-3.5 ${borderClass}`}>
      <div className="flex items-center gap-3">
        <span className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
        <span className="min-w-0 flex-1 truncate text-xs text-ink/65">{result.submittedUrl}</span>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.bg} ${s.text}`}
        >
          {result.category}
        </span>
        <span className="shrink-0 text-[11px] font-semibold tabular-nums text-ink/55">
          {pct}%
        </span>
        {result.cached && (
          <span className="shrink-0 rounded-full border border-black/[0.07] bg-white px-1.5 py-0.5 text-[9px] text-ink/35">
            cached
          </span>
        )}
      </div>
      <p className="mt-1.5 line-clamp-2 pl-5 text-[11px] leading-5 text-ink/45">
        {result.explanation}
      </p>
    </div>
  );
}
