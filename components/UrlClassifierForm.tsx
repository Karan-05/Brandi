"use client";

import { useState } from "react";
import { ErrorMessage } from "@/components/ErrorMessage";
import { LoadingState } from "@/components/LoadingState";
import { ResultCard } from "@/components/ResultCard";
import type { ClassifyApiError, ClassifyApiSuccess } from "@/lib/types";

type FormState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; result: ClassifyApiSuccess };

type UrlClassifierFormProps = {
  onSuccess?: (result: ClassifyApiSuccess) => void;
};

export function UrlClassifierForm({ onSuccess }: UrlClassifierFormProps) {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<FormState>({ status: "idle" });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "loading" });

    try {
      const response = await fetch("/api/classify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const payload = (await response.json()) as ClassifyApiSuccess | ClassifyApiError;

      if (!response.ok || "error" in payload) {
        const message =
          "error" in payload ? payload.error.message : "The classifier could not process this page. Please try again.";
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
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl text-ink">Try a public webpage</h2>
        <p className="text-sm leading-6 text-ink/68">
          The server validates the URL, scrapes the single page, and returns a structured classification result.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink" htmlFor="website-url">
            Website URL
          </label>
          <input
            id="website-url"
            name="url"
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://example.com"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            disabled={isLoading}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10 disabled:cursor-not-allowed disabled:bg-stone-50"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent/90 focus:outline-none focus:ring-4 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-accent/50"
        >
          {isLoading ? "Classifying…" : "Classify website"}
        </button>
      </form>

      <div className="min-h-36 space-y-4">
        {state.status === "loading" ? <LoadingState /> : null}
        {state.status === "error" ? <ErrorMessage message={state.message} /> : null}
        {state.status === "success" ? <ResultCard result={state.result} /> : null}
        {state.status === "idle" ? (
          <div className="rounded-3xl border border-dashed border-black/10 bg-white/55 px-4 py-5 text-sm leading-6 text-ink/58">
            Results appear here after you submit a public URL. Repeated URLs may be served from the in-memory cache.
          </div>
        ) : null}
      </div>
    </div>
  );
}
