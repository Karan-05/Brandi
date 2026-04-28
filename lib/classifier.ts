import { TTLCache } from "@/lib/cache";
import { createDefaultLlmProvider, type LlmProvider } from "@/lib/llm";
import { createDefaultScraper, type Scraper } from "@/lib/scrape";
import { normalizeAndValidateUrl } from "@/lib/url";
import type { Classification, ClassifyApiSuccess } from "@/lib/types";

const CACHE_TTL_MS = 20 * 60 * 1000;

type CachedClassification = Omit<ClassifyApiSuccess, "cached">;

export type WebsiteClassifierDependencies = {
  scraper: Scraper;
  llm: LlmProvider;
  cache: TTLCache<string, CachedClassification>;
};

function createDefaultDependencies(): WebsiteClassifierDependencies {
  return {
    scraper: createDefaultScraper(),
    llm: createDefaultLlmProvider(),
    cache: new TTLCache<string, CachedClassification>(CACHE_TTL_MS),
  };
}

let defaultDependencies: WebsiteClassifierDependencies | undefined;

function getDefaultDependencies() {
  defaultDependencies ??= createDefaultDependencies();
  return defaultDependencies;
}

export async function classifyWebsite(
  rawUrl: string,
  dependencies?: WebsiteClassifierDependencies,
): Promise<ClassifyApiSuccess> {
  const startedAt = performance.now();

  // Validate URL before touching any external dependency
  const { submittedUrl, normalizedUrl } = normalizeAndValidateUrl(rawUrl);

  const deps = dependencies ?? getDefaultDependencies();
  const cachedResult = deps.cache.get(normalizedUrl);

  if (cachedResult) {
    return {
      ...cachedResult,
      cached: true,
    };
  }

  const scrapeStartedAt = performance.now();
  const page = await deps.scraper.scrape(normalizedUrl);
  const scrapeMs = Math.round(performance.now() - scrapeStartedAt);

  const classifyStartedAt = performance.now();
  const classification = await deps.llm.classify({
    url: normalizedUrl,
    page,
  });
  const classifyMs = Math.round(performance.now() - classifyStartedAt);

  const result = buildResponse({ submittedUrl, normalizedUrl, classification });
  deps.cache.set(normalizedUrl, result);

  logTiming({
    normalizedUrl,
    scrapeMs,
    classifyMs,
    totalMs: Math.round(performance.now() - startedAt),
  });

  return {
    ...result,
    cached: false,
    timingMs: {
      scrape: scrapeMs,
      classify: classifyMs,
      total: Math.round(performance.now() - startedAt),
    },
  };
}

function buildResponse({
  submittedUrl,
  normalizedUrl,
  classification,
}: {
  submittedUrl: string;
  normalizedUrl: string;
  classification: Classification;
}): CachedClassification {
  return {
    submittedUrl,
    normalizedUrl,
    category: classification.category,
    confidence: Number(classification.confidence.toFixed(2)),
    explanation: classification.explanation,
  };
}

function logTiming(metrics: { normalizedUrl: string; scrapeMs: number; classifyMs: number; totalMs: number }) {
  if (process.env.NODE_ENV === "development") {
    console.info("[classifier]", metrics);
  }
}

export function createClassifierDependencies(overrides: Partial<WebsiteClassifierDependencies>) {
  return {
    scraper: overrides.scraper ?? createDefaultScraper(),
    llm: overrides.llm ?? createDefaultLlmProvider(),
    cache: overrides.cache ?? new TTLCache<string, CachedClassification>(CACHE_TTL_MS),
  };
}
