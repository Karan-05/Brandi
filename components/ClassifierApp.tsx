"use client";

import { CategoryStats } from "@/components/CategoryStats";
import { ClassificationHistory } from "@/components/ClassificationHistory";
import { UrlClassifierForm } from "@/components/UrlClassifierForm";
import { useClassificationHistory } from "@/hooks/useClassificationHistory";

export function ClassifierApp() {
  const { history, addResult, clearHistory } = useClassificationHistory();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-black/5 bg-white/70 px-6 py-8 shadow-panel backdrop-blur sm:px-10 sm:py-10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full border border-accent/15 bg-accent/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              Single-page URL classification
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl leading-tight text-ink sm:text-5xl">
                A focused website classifier with pragmatic scraping, caching, and structured LLM output.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-ink/72 sm:text-lg">
                Submit one public URL. The server validates it, scrapes the page, trims the content, and asks an LLM
                to classify the page into one of four categories with a short explanation.
              </p>
            </div>
            <dl className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-black/5 bg-canvas/80 p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">Categories</dt>
                <dd className="mt-2 text-sm text-ink/80">Ecommerce, Social / UGC, News / Media, Other</dd>
              </div>
              <div className="rounded-2xl border border-black/5 bg-canvas/80 p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">Caching</dt>
                <dd className="mt-2 text-sm text-ink/80">Process-local TTL cache for repeat submissions</dd>
              </div>
              <div className="rounded-2xl border border-black/5 bg-canvas/80 p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">Guardrails</dt>
                <dd className="mt-2 text-sm text-ink/80">Public URL validation and prompt injection resistance</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-[1.75rem] border border-black/5 bg-gradient-to-br from-white via-white to-blush/50 p-1 shadow-panel">
            <div className="rounded-[1.5rem] border border-black/5 bg-white/95 p-5 sm:p-6">
              <UrlClassifierForm onSuccess={addResult} />
            </div>
          </div>
        </div>
      </section>

      {history.length > 0 && (
        <section className="space-y-8 rounded-[2rem] border border-black/5 bg-white/70 px-6 py-8 shadow-panel backdrop-blur sm:px-10 sm:py-10">
          <CategoryStats history={history} />
          <ClassificationHistory history={history} onClear={clearHistory} />
        </section>
      )}
    </main>
  );
}
