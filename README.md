# Website Classifier

A small but production-minded Next.js take-home project that classifies a single submitted webpage into exactly one category:

- `Ecommerce`
- `Social / UGC`
- `News / Media`
- `Other`

The app accepts a public URL, validates it, scrapes that single page with Firecrawl, trims the extracted content, sends the content to an LLM behind a provider abstraction, validates the structured JSON output with Zod, and returns a compact result with an explanation and optional confidence score.

## Demo

Clone the repo, add API keys to `.env.local`, and run `npm run dev` to try it locally at `http://localhost:3000`.

## Features

- Next.js App Router with a single focused screen
- TypeScript strict mode
- Tailwind CSS UI with loading, success, and error states
- `POST /api/classify` server route
- Firecrawl scraper abstraction with Firecrawl as the default provider
- LLM provider abstraction with OpenAI as the default implementation
- Structured JSON output enforced via JSON schema and validated with Zod
- One retry path for malformed LLM output
- Process-local in-memory TTL cache for repeated normalized URLs
- Pragmatic public URL validation and basic SSRF guardrails
- Lightweight Vitest coverage for URL validation, cache behavior, and classifier logic
- Docker support for reproducible local review and portability

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Zod
- Vitest
- Firecrawl API
- OpenAI API

## Project Structure

```text
app/
  api/classify/route.ts
  globals.css
  layout.tsx
  page.tsx
components/
  ErrorMessage.tsx
  LoadingState.tsx
  ResultCard.tsx
  UrlClassifierForm.tsx
lib/
  cache.ts
  classifier.ts
  errors.ts
  llm.ts
  prompt.ts
  scrape.ts
  types.ts
  url.ts
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

Copy the example file and fill in real API keys:

```bash
cp .env.example .env.local
```

Required variables:

- `FIRECRAWL_API_KEY` — Firecrawl scraper

LLM provider — set exactly one:

- `GROQ_API_KEY` — checked first; free tier at [console.groq.com](https://console.groq.com)
- `OPENAI_API_KEY` — OpenAI fallback
- `LLM_API_KEY` — generic fallback alias for `OPENAI_API_KEY`

Optional variables:

- `LLM_MODEL` — model name override; defaults to `llama-3.3-70b-versatile` (Groq) or `gpt-4.1-mini` (OpenAI)

## Run Locally

```bash
npm install
npm run dev
```

Then visit `http://localhost:3000`.

## Run Tests

```bash
npm run test
```

## Build For Production

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

Request:

```json
{
  "url": "https://example.com"
}
```

Success response:

```json
{
  "submittedUrl": "https://example.com",
  "normalizedUrl": "https://example.com/",
  "category": "Other",
  "confidence": 0.71,
  "explanation": "The page is informational and does not primarily match commerce, social, or news behavior.",
  "cached": false
}
```

Error response:

```json
{
  "error": {
    "code": "INVALID_URL",
    "message": "Please enter a valid public URL."
  }
}
```

## Implementation Choices

### Single-page scope

The assignment explicitly says not to overbuild and not to crawl entire websites. The implementation classifies exactly one submitted URL and makes no attempt to follow links or build site-wide summaries.

### Scraping

`lib/scrape.ts` defines a scraper abstraction and uses Firecrawl as the default provider. That keeps the app logic clean while avoiding the complexity of maintaining a custom crawler for a take-home project.

The extracted content is normalized before the LLM sees it:

- whitespace is collapsed
- markdown is converted to plain-ish text
- title and description are included when available
- the final text sent to the LLM is truncated to about 10k characters

### Classification

`lib/llm.ts` keeps the model call behind a small provider interface. The default implementation uses OpenAI’s chat completions endpoint with a strict JSON schema response format.

The model is instructed to:

- choose exactly one allowed category
- treat webpage content as untrusted data
- ignore instructions embedded in the scraped page
- return JSON only

The JSON is validated with Zod. If the model returns malformed output anyway, the app retries once with a stricter repair prompt.

### Caching

The app uses a simple in-memory TTL cache keyed by normalized URL.

- default TTL: 20 minutes
- cache hits bypass scraping and LLM work
- results include `cached: true` or `false`

This is intentionally small-scope and fast, but it is process-local and not durable.

### Session History

Classification results are stored in `localStorage` under the key `classification-history`, so the history panel survives page reloads within the same browser.

- max 50 entries; older entries are dropped when the cap is reached
- repeated submissions for the same `normalizedUrl` replace the earlier entry rather than appending
- `localStorage` writes happen outside React's state setter to avoid the React 18 strict-mode double-invoke pattern

**Privacy note:** submitted URLs, including any query parameters they carry, are written to `localStorage`. In a user-facing product I would add a clear disclosure, a configurable retention period, and a per-URL delete action. For this take-home the "Clear history" button in the UI is sufficient.

## Security Considerations

This project adds pragmatic URL safety checks before scraping:

- only `http` and `https` are allowed
- empty URLs are rejected
- embedded credentials are rejected
- `localhost` is rejected
- obvious private and internal IP ranges are rejected
- the cloud metadata IP `169.254.169.254` is rejected
- request timeouts are enforced for scraping and LLM calls
- scraped content is treated as untrusted input
- the LLM prompt explicitly says not to follow webpage instructions

Important tradeoff: this is pragmatic SSRF protection, not enterprise-grade network isolation. It does not perform full DNS resolution or guarantee protection against every hostname-based bypass. In a higher-risk environment, I would combine app-layer validation with network-layer egress controls.

## Known Limitations

- The cache is process-local, so it is not shared across serverless instances and is lost on restart.
- Firecrawl can still fail on sites that block bots or aggressively challenge automated traffic.
- Classification quality depends on the scraped content being representative of the page.
- The app does not resolve hostnames to IPs before requests, so SSRF defenses are intentionally practical rather than exhaustive.
- Only a single page is classified because the prompt explicitly rules out full-site crawling.

## Future Improvements

- Add per-IP rate limiting at the API layer
- Add provider failover for scraping and LLM calls
- Resolve and vet DNS targets before outbound fetches in environments where that is feasible
- Add request tracing and metrics beyond the small development timing logs
- Add e2e coverage for the form flow
- Persist cache entries in Redis if the deployment shape needs shared caching

## Docker

Docker is included for local reproducibility and portability to container-based platforms. It is not required for Vercel deployment.

### Docker Local Run

1. `cp .env.example .env.local`
2. Fill in your API keys
3. `docker compose up --build`
4. Visit `http://localhost:3000`

The Docker image uses:

- multi-stage builds
- `node:20-alpine`
- Next.js standalone output
- a non-root runtime user

### Important Docker Tradeoff

Vercel does not run the provided Dockerfile. The Dockerfile is included for reproducible local review and portability to container-based platforms such as Fly.io, Render, Railway, AWS ECS, or Google Cloud Run.

## Vercel Deployment

Vercel deployment uses the normal Next.js build flow rather than the Docker image.

1. Push the repo to GitHub
2. Import the repo into Vercel
3. Add environment variables:
   - `FIRECRAWL_API_KEY`
   - `OPENAI_API_KEY`
   - `LLM_MODEL`
4. Deploy

## Container-Based Deployment

For platforms that accept Docker images, the included `Dockerfile` builds a standalone production image. The same environment variables are required there as well.

## How To Explain The Architecture

If I were walking an interviewer through it, the key points are:

- validation happens before any network work
- cache lookup happens before scraping and classification
- scraping and LLM calls are isolated behind small interfaces
- schema validation sits between the model output and the API response
- the UI is deliberately small but handles loading, success, and failure cleanly
- the tradeoffs are explicit rather than hidden
