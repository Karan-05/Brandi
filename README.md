# Website Classifier

A production-minded Next.js app that classifies any public webpage into exactly one category:

- `Ecommerce`
- `Social / UGC`
- `News / Media`
- `Other`

Submit a URL → the page is scraped → content trimmed and sent to an LLM → structured JSON result returned with a category, confidence score, and explanation.

## Features

**Core pipeline**
- `POST /api/classify` — validates URL, scrapes with Firecrawl, classifies with an LLM, returns structured JSON
- Zod schema validation on all LLM output; one repair-prompt retry on malformed output
- Confidence-threshold fallback routing: if primary model confidence < 0.65, retries automatically with a stronger model (`qwen-qwq-32b` on Groq, `gpt-4.1` on OpenAI) and marks the result `reclassified: true`
- Process-local in-memory TTL cache (20 min) keyed on normalized URL — cache hits skip scraping and LLM entirely
- In-flight request coalescing: concurrent requests for the same URL share one in-progress scrape

**Reliability & safety**
- Per-IP rate limiting (10 req/min) on the env-key path; BYOK requests bypass this and use their own provider quota
- SSRF guardrails: HTTPS-only, no localhost, no private IP ranges, no cloud metadata IP, no embedded credentials
- Prompt injection resistance: scraped content is explicitly framed as untrusted data

**UI**
- Single URL mode: result card with category, confidence bar, explanation, timing breakdown, cached/fresh and re-classified badges
- Batch mode: paste up to 15 URLs (one per line); 4 run concurrently with a live progress bar; inline results table with per-row category, confidence, and explanation
- Classification history panel with category breakdown stats, persisted in `localStorage` (max 50 entries, deduped by normalized URL)
- BYOK panel: enter your own Firecrawl and Groq keys directly in the browser; keys are stored only in `localStorage` and sent as request headers — never logged server-side

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript (strict)
- Tailwind CSS
- Zod
- Vitest
- Firecrawl API
- Groq API (`llama-3.3-70b-versatile` primary, `qwen-qwq-32b` fallback)
- OpenAI API (`gpt-4.1-mini` primary, `gpt-4.1` fallback)

## Project Structure

```text
app/
  api/classify/route.ts   — POST handler, rate limiting, BYOK dep assembly
  globals.css
  layout.tsx
  page.tsx
components/
  ApiKeysPanel.tsx        — BYOK key input with format validation
  BatchClassifierForm.tsx — multi-URL textarea, concurrency runner, results table
  CategoryStats.tsx       — breakdown chart for classification history
  ClassificationHistory.tsx
  ErrorMessage.tsx
  LoadingState.tsx
  ResultCard.tsx          — single result with confidence bar, badges, timing
  UrlClassifierForm.tsx
  ClassifierApp.tsx       — root layout, Single/Batch tab toggle
hooks/
  useApiKeys.ts           — localStorage persistence for BYOK keys
  useClassificationHistory.ts
lib/
  cache.ts                — generic TTL cache
  classifier.ts           — orchestrates scrape → classify → cache
  errors.ts               — typed error classes and response mapping
  llm.ts                  — LlmProvider interface, OpenAiLlmProvider, WithFallbackProvider
  prompt.ts               — classification and repair prompt builders
  scrape.ts               — Scraper interface, FirecrawlScraper
  types.ts                — Zod schemas and TypeScript types
  url.ts                  — URL normalization and SSRF validation
tests/
  cache.test.ts
  classifier.test.ts
  url.test.ts
```

## Setup

### Prerequisites

- Node.js 20+
- npm 10+

### Environment Variables

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `FIRECRAWL_API_KEY` | Yes | Firecrawl scraper — free tier at [firecrawl.dev](https://firecrawl.dev) |
| `GROQ_API_KEY` | One of these | Checked first — free tier at [console.groq.com](https://console.groq.com) |
| `OPENAI_API_KEY` | One of these | OpenAI fallback |
| `LLM_API_KEY` | One of these | Generic alias for `OPENAI_API_KEY` |
| `LLM_MODEL` | No | Model name override; defaults to `llama-3.3-70b-versatile` (Groq) or `gpt-4.1-mini` (OpenAI) |

## Run Locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

## Run Tests

```bash
npm run test
```

## Build

```bash
npm run build
```

## Lint and Type Check

```bash
npm run lint
npm run typecheck
```

## API Contract

### `POST /api/classify`

**Headers (optional — BYOK):**
- `x-firecrawl-key` — use caller's Firecrawl key instead of env key
- `x-groq-key` — use caller's Groq key instead of env key

**Request:**

```json
{ "url": "https://example.com" }
```

**Success response:**

```json
{
  "submittedUrl": "https://example.com",
  "normalizedUrl": "https://example.com/",
  "category": "Other",
  "confidence": 0.71,
  "explanation": "The page is informational and does not primarily match commerce, social, or news patterns.",
  "cached": false,
  "reclassified": true,
  "timingMs": { "scrape": 1820, "classify": 940, "total": 2763 }
}
```

`reclassified` is present and `true` only when the fallback model was used. `timingMs` is omitted on cache hits.

**Error response:**

```json
{
  "error": {
    "code": "INVALID_URL",
    "message": "Please enter a valid public URL."
  }
}
```

Error codes: `INVALID_URL` · `SCRAPE_FAILED` · `CLASSIFICATION_FAILED` · `RATE_LIMITED` · `UNKNOWN`

## Implementation Notes

### Confidence-threshold routing

When the primary LLM returns confidence below 0.65, `WithFallbackProvider` fires a second call to a stronger model. This catches ambiguous pages (community-plus-marketplace hybrids, aggregator sites) that the fast model hedges on. The fallback result is cached and surfaced in the UI with a "Re-classified" badge so the behaviour is visible rather than hidden.

### Prompt design

The system prompt frames scraped content as untrusted external data and explicitly instructs the model to ignore any instructions embedded in the page. Category definitions include disambiguation rules for the common overlap cases (marketplaces with communities, review sites vs. professional critics, `.gov` sites that publish news). The user prompt carries the URL, TLD, page title, and description as structured metadata before the full content, so the model has structured signals before the noise.

### Caching and coalescing

The TTL cache is keyed on normalized URL (trailing slash enforced, default path stripped). A `Map<string, Promise>` layer coalesces concurrent in-flight requests for the same URL so the first caller does the work and late arrivals await the same promise — no duplicate scrapes under load.

### BYOK

BYOK keys arrive in request headers, never in the body. The server assembles a fresh dep set (scraper + LLM) for each BYOK request and bypasses the per-IP rate limit. The shared process-local cache is always used regardless of whose credentials fetched the page.

## Security

- HTTPS-only; `http://` and non-HTTP schemes are rejected
- No `localhost`, `127.*`, `10.*`, `172.16-31.*`, `192.168.*`, `169.254.*`
- No embedded credentials in URLs
- Request timeouts enforced on scraping (Firecrawl handles this) and LLM calls (12 s)
- Scraped content treated as untrusted; model is told not to follow page instructions

**Tradeoff:** SSRF protection is app-layer only. It does not resolve hostnames to IPs before scraping. In higher-risk environments combine with network-layer egress controls.

## Known Limitations

- Cache is process-local — not shared across serverless instances, lost on restart. Redis would fix this.
- Firecrawl fails on bot-blocking or heavy JS-gated pages.
- The fallback model adds a second LLM call latency (~1-2 s extra) on low-confidence cases.
- Only one page is classified per submission — full-site crawling is out of scope.

## Docker

```bash
cp .env.example .env.local   # fill in API keys
docker compose up --build
# → http://localhost:3000
```

Multi-stage build, `node:20-alpine`, Next.js standalone output, non-root runtime user.

> Vercel ignores the Dockerfile and uses its standard Next.js build. The Dockerfile is for local reproducibility and container platforms (Fly.io, Render, Railway, ECS, Cloud Run).

## Vercel Deployment

1. Push repo to GitHub
2. Import into Vercel
3. Set environment variables: `FIRECRAWL_API_KEY`, `GROQ_API_KEY` (or `OPENAI_API_KEY`)
4. Deploy
