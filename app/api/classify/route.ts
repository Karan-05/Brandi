import { NextResponse } from "next/server";
import { z } from "zod";
import { classifyWebsite, getDefaultDependencies, type WebsiteClassifierDependencies } from "@/lib/classifier";
import { FirecrawlScraper } from "@/lib/scrape";
import { createGroqProvider } from "@/lib/llm";
import { toErrorResponse } from "@/lib/errors";

const requestSchema = z.object({
  url: z.string(),
});

// ── Per-IP rate limit (env-fallback path only) ────────────────────────────────
// BYOK requests are excluded — they pay their own provider quota.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

type Bucket = { count: number; windowStart: number };
const ipBuckets = new Map<string, Bucket>();

function checkIpRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = ipBuckets.get(ip);

  if (!bucket || now - bucket.windowStart > RATE_LIMIT_WINDOW_MS) {
    ipBuckets.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (bucket.count >= RATE_LIMIT_MAX) return false;
  bucket.count++;
  return true;
}

// ── BYOK dep assembly ─────────────────────────────────────────────────────────
function buildByokDeps(
  firecrawlKey: string | null,
  groqKey: string | null,
): WebsiteClassifierDependencies {
  const defaults = getDefaultDependencies();
  return {
    // Swap scraper/LLM if the user supplied their own key; otherwise fall back
    // to the env-configured defaults so partial BYOK (one key only) still works.
    scraper: firecrawlKey ? new FirecrawlScraper(firecrawlKey) : defaults.scraper,
    llm: groqKey ? createGroqProvider(groqKey) : defaults.llm,
    // Always share the process-local cache — same URL yields same result
    // regardless of whose credentials fetched it.
    cache: defaults.cache,
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { url } = requestSchema.parse(json);

    // Keys arrive in headers so they never touch the request body / logs.
    const firecrawlKey = request.headers.get("x-firecrawl-key");
    const groqKey = request.headers.get("x-groq-key");
    const hasByokKeys = Boolean(firecrawlKey || groqKey);

    if (!hasByokKeys) {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
      if (!checkIpRateLimit(ip)) {
        return NextResponse.json(
          {
            error: {
              code: "RATE_LIMITED",
              message:
                "Too many requests. Please wait a minute, or add your own API keys to skip this limit.",
            },
          },
          { status: 429, headers: { "Retry-After": "60" } },
        );
      }
    }

    const deps = hasByokKeys ? buildByokDeps(firecrawlKey, groqKey) : undefined;
    const result = await classifyWebsite(url, deps);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "INVALID_URL", message: "Please enter a valid public URL." } },
        { status: 400 },
      );
    }

    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
