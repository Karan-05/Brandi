import { RateLimitedError, ScrapeFailedError, TimeoutError } from "@/lib/errors";
import type { ScrapedPage } from "@/lib/types";

const DEFAULT_SCRAPE_TIMEOUT_MS = 12_000;
const MAX_BODY_HEAD_CHARS = 2_000;
const MAX_BODY_TAIL_CHARS = 500;

export interface Scraper {
  scrape(url: string): Promise<ScrapedPage>;
}

type FirecrawlResponse = {
  success?: boolean;
  data?: {
    markdown?: string;
    content?: string;
    metadata?: {
      title?: string;
      description?: string;
    };
    title?: string;
    description?: string;
  };
  error?: string;
};

export class FirecrawlScraper implements Scraper {
  constructor(
    private readonly apiKey: string,
    private readonly timeoutMs = DEFAULT_SCRAPE_TIMEOUT_MS,
  ) {}

  async scrape(url: string): Promise<ScrapedPage> {
    let response: Response;

    try {
      response = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          url,
          formats: ["markdown"],
          onlyMainContent: true,
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      if (isAbortError(error)) {
        throw new TimeoutError("scrape");
      }

      throw new ScrapeFailedError();
    }

    if (response.status === 429) {
      throw new RateLimitedError("The scraping provider is temporarily rate limited. Please try again shortly.");
    }

    if (!response.ok) {
      throw new ScrapeFailedError();
    }

    const payload = (await response.json()) as FirecrawlResponse;

    if (!payload.success || !payload.data) {
      throw new ScrapeFailedError(payload.error ? "We could not read this page. It may block scraping." : undefined);
    }

    const title = cleanText(payload.data.metadata?.title ?? payload.data.title);
    const description = cleanText(payload.data.metadata?.description ?? payload.data.description);
    const markdown = cleanText(payload.data.markdown ?? payload.data.content);
    const text = buildLlmText({ title, description, markdown });

    if (!text) {
      throw new ScrapeFailedError("We could not extract enough readable content from this page.");
    }

    return {
      title,
      description,
      markdown: markdown ? markdown.slice(0, MAX_BODY_HEAD_CHARS + MAX_BODY_TAIL_CHARS) : undefined,
      text,
    };
  }
}

export function buildLlmText(page: { title?: string; description?: string; markdown?: string }) {
  const body = markdownToText(page.markdown);

  // No body — fall back to title + description so the non-empty check in scrape() passes
  if (!body) {
    return cleanText([page.title, page.description].filter(Boolean).join("\n")) ?? "";
  }

  // Short enough to keep in full
  if (body.length <= MAX_BODY_HEAD_CHARS + MAX_BODY_TAIL_CHARS) {
    return cleanText(body) ?? "";
  }

  // Head + tail: beginning carries primary category signals; tail carries nav/footer link text
  const head = cleanText(body.slice(0, MAX_BODY_HEAD_CHARS)) ?? "";
  const tail = cleanText(body.slice(-MAX_BODY_TAIL_CHARS)) ?? "";
  return [head, "[…]", tail].filter(Boolean).join("\n");
}

function markdownToText(markdown?: string) {
  if (!markdown) {
    return "";
  }

  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[>\-*+]\s+/gm, "")
    .replace(/\|/g, " ")
    .replace(/[_*`~]/g, " ");
}

function cleanText(value?: string) {
  return value?.replace(/\s+/g, " ").trim();
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "TimeoutError";
}

export function createDefaultScraper() {
  const apiKey = process.env.FIRECRAWL_API_KEY;

  if (!apiKey) {
    throw new ScrapeFailedError("FIRECRAWL_API_KEY is not configured.", 500);
  }

  return new FirecrawlScraper(apiKey);
}
