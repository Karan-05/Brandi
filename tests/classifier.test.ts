import { afterEach, describe, expect, it, vi } from "vitest";
import { TTLCache } from "@/lib/cache";
import { classifyWebsite } from "@/lib/classifier";
import { parseClassification, OpenAiLlmProvider } from "@/lib/llm";
import type { LlmProvider } from "@/lib/llm";
import type { Scraper } from "@/lib/scrape";

describe("parseClassification", () => {
  it("accepts valid classifier JSON", () => {
    const parsed = parseClassification(
      JSON.stringify({
        category: "Ecommerce",
        confidence: 0.92,
        explanation: "The page focuses on products, pricing, and shopping actions.",
      }),
    );

    expect(parsed.category).toBe("Ecommerce");
  });

  it("rejects invalid categories", () => {
    expect(() =>
      parseClassification(
        JSON.stringify({
          category: "Marketplace",
          confidence: 0.5,
          explanation: "Invalid category",
        }),
      ),
    ).toThrow();
  });
});

describe("OpenAiLlmProvider", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("retries with the repair prompt when the first response is malformed JSON", async () => {
    const validJson = JSON.stringify({
      category: "Ecommerce",
      confidence: 0.91,
      explanation: "Repaired classification.",
    });

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: "not valid json at all" } }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: validJson } }],
        }),
      });

    vi.stubGlobal("fetch", mockFetch);

    const provider = new OpenAiLlmProvider("test-key");
    const result = await provider.classify({
      url: "https://example.com",
      page: { title: "Store", text: "Buy things." },
    });

    expect(result.category).toBe("Ecommerce");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

describe("classifyWebsite", () => {
  it("returns cached results on repeated normalized URLs", async () => {
    const scraper: Scraper = {
      scrape: vi.fn().mockResolvedValue({
        title: "Store",
        description: "Buy things",
        text: "A catalog with prices and checkout.",
      }),
    };

    const llm: LlmProvider = {
      classify: vi.fn().mockResolvedValue({
        category: "Ecommerce",
        confidence: 0.87,
        explanation: "The page centers on browsing products and purchasing them.",
      }),
    };

    const cache = new TTLCache<string, Omit<Awaited<ReturnType<typeof classifyWebsite>>, "cached">>(60_000);
    const dependencies = { scraper, llm, cache };

    const first = await classifyWebsite("https://example.com/store/", dependencies);
    const second = await classifyWebsite("https://example.com/store", dependencies);

    expect(first.cached).toBe(false);
    expect(second.cached).toBe(true);
    expect(scraper.scrape).toHaveBeenCalledTimes(1);
    expect(llm.classify).toHaveBeenCalledTimes(1);
  });
});
