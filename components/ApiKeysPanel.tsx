"use client";

import { useState } from "react";
import type { ApiKeys } from "@/hooks/useApiKeys";

type ApiKeysPanelProps = {
  keys: ApiKeys;
  onChange: (keys: ApiKeys) => void;
  onClear: () => void;
};

// Loose format checks — just catch obvious paste mistakes.
// Don't be strict; key formats can change across provider versions.
const FC_RE = /^fc-[a-zA-Z0-9]{20,}$/;
const GROQ_RE = /^gsk_[A-Za-z0-9]{20,}$/;

function isValidFcKey(key: string) {
  return !key || FC_RE.test(key);
}

function isValidGroqKey(key: string) {
  return !key || GROQ_RE.test(key);
}

export function ApiKeysPanel({ keys, onChange, onClear }: ApiKeysPanelProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ApiKeys>(keys);

  const hasKeys = Boolean(keys.firecrawlKey || keys.groqKey);
  const fcValid = isValidFcKey(draft.firecrawlKey);
  const groqValid = isValidGroqKey(draft.groqKey);
  const canSave = fcValid && groqValid;

  function handleOpen() {
    setDraft(keys);
    setOpen(true);
  }

  function handleSave() {
    if (!canSave) return;
    onChange(draft);
    setOpen(false);
  }

  function handleClear() {
    onClear();
    setDraft({ firecrawlKey: "", groqKey: "" });
    setOpen(false);
  }

  return (
    <div className="mt-5 border-t border-black/[0.06] pt-4">
      {!open ? (
        <button
          type="button"
          onClick={handleOpen}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-xs text-ink/45">
            {hasKeys ? "API keys configured" : "Use your own API keys"}
          </span>
          {hasKeys ? (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
              Active — edit
            </span>
          ) : (
            <span className="text-[10px] text-ink/30">Optional ›</span>
          )}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-ink/60">Your API keys</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[10px] text-ink/35 hover:text-ink/65 transition-colors"
            >
              Close
            </button>
          </div>

          <div className="space-y-3">
            <KeyInput
              label="Firecrawl key"
              placeholder="fc-…"
              value={draft.firecrawlKey}
              valid={fcValid}
              hint="Free key at firecrawl.dev"
              onChange={(v) => setDraft((d) => ({ ...d, firecrawlKey: v }))}
            />
            <KeyInput
              label="Groq key"
              placeholder="gsk_…"
              value={draft.groqKey}
              valid={groqValid}
              hint="Free key at console.groq.com"
              onChange={(v) => setDraft((d) => ({ ...d, groqKey: v }))}
            />
          </div>

          <p className="text-[10px] leading-4 text-ink/35">
            Keys are stored only in your browser and sent directly to your provider accounts per
            request. They are never logged or persisted server-side.
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="rounded-xl bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent/90 focus:outline-none focus:ring-4 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save keys
            </button>
            {hasKeys && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-ink/35 underline underline-offset-2 transition hover:text-ink/65"
              >
                Clear keys
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function KeyInput({
  label,
  placeholder,
  value,
  valid,
  hint,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  valid: boolean;
  hint: string;
  onChange: (v: string) => void;
}) {
  const invalid = !valid && value.length > 0;
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.15em] text-ink/40">
        {label}
      </label>
      <input
        type="password"
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-xl border bg-white px-3 py-2 font-mono text-xs text-ink outline-none transition ${
          invalid
            ? "border-rose-300 focus:ring-4 focus:ring-rose-100"
            : "border-black/10 focus:border-accent focus:ring-4 focus:ring-accent/10"
        }`}
      />
      {invalid ? (
        <p className="mt-1 text-[10px] text-rose-500">Invalid format — check for typos.</p>
      ) : (
        !value && <p className="mt-1 text-[10px] text-ink/30">{hint}</p>
      )}
    </div>
  );
}
