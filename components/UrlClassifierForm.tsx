"use client";

import { useState } from "react";
import { ErrorMessage } from "@/components/ErrorMessage";
import { LoadingState } from "@/components/LoadingState";
import { ResultCard } from "@/components/ResultCard";
import type { ApiKeys } from "@/hooks/useApiKeys";
import type { ClassifyApiError, ClassifyApiSuccess } from "@/lib/types";

type FormState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; result: ClassifyApiSuccess };

type UrlClassifierFormProps = {
  onSuccess?: (result: ClassifyApiSuccess) => void;
  apiKeys?: ApiKeys;
};

const CATEGORIES = [
  { label: "Ecommerce", color: "bg-amber-400" },
  { label: "Social / UGC", color: "bg-sky-400" },
  { label: "News / Media", color: "bg-emerald-500" },
  { label: "Other", color: "bg-stone-400" },
];

export function UrlClassifierForm({ onSuccess, apiKeys }: UrlClassifierFormProps) {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<FormState>({ status: "idle" });

  const hasByokKeys = Boolean(apiKeys?.firecrawlKey || apiKeys?.groqKey);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "loading" });

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKeys?.firecrawlKey) headers["x-firecrawl-key"] = apiKeys.firecrawlKey;
    if (apiKeys?.groqKey) headers["x-groq-key"] = apiKeys.groqKey;

    try {
      const response = await fetch("/api/classify", {
        method: "POST",
        headers,
        body: JSON.stringify({ url }),
      });

      const payload = (await response.json()) as ClassifyApiSuccess | ClassifyApiError;

      if (!response.ok || "error" in payload) {
        const message =
          "error" in payload
            ? payload.error.message
            : "The classifier could not process this page. Please try again.";
        setState({ status: "error", message });
        return;
      }

      setState({ status: "success", result: payload });
      onSuccess?.(payload);
    } catch {
      setState({
        status: "error",
        message: "The classifier could not process this page. Please try again.",
      });
    }
  }

  const isLoading = state.status === "loading";

  return (
    <div className="space-y-5">
      {hasByokKeys && (
        <div className="flex items-center gap-1.5 rounded-full border border-accent/15 bg-accent/8 px-2.5 py-1 w-fit">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="text-[10px] font-semibold text-accent">Using your API keys</span>
        </div>
      )}

      <form className="space-y-3" onSubmit={handleSubmit}>
        <label className="text-sm font-medium text-ink/75" htmlFor="website-url">
          Enter a public URL
        </label>

        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35">
            <LinkIcon />
          </span>
          <input
            id="website-url"
            name="url"
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
            className="w-full rounded-2xl border border-black/10 bg-white py-3 pl-10 pr-4 text-sm text-ink outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10 disabled:cursor-not-allowed disabled:opacity-60"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent/90 focus:outline-none focus:ring-4 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Classifying…
            </>
          ) : (
            <>
              Classify
              <ArrowIcon />
            </>
          )}
        </button>
      </form>

      <div className="min-h-36 space-y-4">
        {state.status === "loading" && <LoadingState />}
        {state.status === "error" && <ErrorMessage message={state.message} />}
        {state.status === "success" && <ResultCard result={state.result} />}
        {state.status === "idle" && (
          <div className="rounded-3xl border border-dashed border-black/10 px-5 py-6">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-ink/35">Detects</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {CATEGORIES.map(({ label, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${color}`} />
                  <span className="text-xs text-ink/60">{label}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs leading-5 text-ink/38">
              Results appear after you submit a URL. Repeated URLs are served from a 20-min cache.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function LinkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8.5 6.5L6.5 8.5M9.5 4.5l.56-.56a3.536 3.536 0 0 1 5 5L14 10M5 10.5l-.56.56a3.536 3.536 0 0 1-5-5L1 5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 6.5h9M7.5 3l3.5 3.5L7.5 10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
