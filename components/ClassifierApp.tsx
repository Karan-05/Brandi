"use client";

import { ApiKeysPanel } from "@/components/ApiKeysPanel";
import { CategoryStats } from "@/components/CategoryStats";
import { ClassificationHistory } from "@/components/ClassificationHistory";
import { UrlClassifierForm } from "@/components/UrlClassifierForm";
import { useApiKeys } from "@/hooks/useApiKeys";
import { useClassificationHistory } from "@/hooks/useClassificationHistory";

export function ClassifierApp() {
  const { history, addResult, clearHistory } = useClassificationHistory();
  const { keys, updateKeys, clearKeys } = useApiKeys();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-black/[0.06] bg-white/75 px-6 py-8 shadow-panel backdrop-blur sm:px-10 sm:py-10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/25 to-transparent" />

        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="space-y-7">
            <div className="inline-flex items-center rounded-full border border-accent/15 bg-accent/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
              Website Classifier
            </div>

            <div className="space-y-4">
              <h1 className="max-w-lg text-4xl leading-tight text-ink sm:text-5xl">
                Classify any webpage, instantly.
              </h1>
              <p className="max-w-md text-base leading-7 text-ink/65">
                Paste a URL. The page is scraped, content trimmed, and an LLM assigns a category
                with a confidence score and explanation — in seconds.
              </p>
            </div>

            <dl className="grid gap-3 sm:grid-cols-3">
              <FeatureTile label="Scraping" detail="Firecrawl converts raw HTML into clean, trimmed markdown" />
              <FeatureTile label="Caching" detail="Repeat URLs are served from a 20-min in-memory TTL cache" />
              <FeatureTile label="Guardrails" detail="SSRF protection, HTTPS-only, prompt injection resistance" />
            </dl>
          </div>

          <div className="rounded-[1.75rem] border border-black/[0.06] bg-gradient-to-br from-white via-white to-blush/40 p-1 shadow-panel">
            <div className="rounded-[1.5rem] border border-black/[0.05] bg-white/95 p-5 sm:p-6">
              <UrlClassifierForm onSuccess={addResult} apiKeys={keys} />
              <ApiKeysPanel keys={keys} onChange={updateKeys} onClear={clearKeys} />
            </div>
          </div>
        </div>
      </section>

      {history.length > 0 && (
        <section className="space-y-8 rounded-[2rem] border border-black/[0.06] bg-white/75 px-6 py-8 shadow-panel backdrop-blur sm:px-10 sm:py-10">
          <CategoryStats history={history} />
          <ClassificationHistory history={history} onClear={clearHistory} />
        </section>
      )}
    </main>
  );
}

function FeatureTile({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-canvas/70 p-4">
      <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/45">{label}</dt>
      <dd className="mt-2 text-xs leading-5 text-ink/70">{detail}</dd>
    </div>
  );
}
