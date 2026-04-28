import { describe, expect, it } from "vitest";
import { TTLCache } from "@/lib/cache";

describe("TTLCache", () => {
  it("returns cached values before expiry", () => {
    const now = 1_000;
    const cache = new TTLCache<string, string>(500, () => now);

    cache.set("key", "value");

    expect(cache.get("key")).toBe("value");
  });

  it("expires values after the ttl", () => {
    let now = 1_000;
    const cache = new TTLCache<string, string>(500, () => now);

    cache.set("key", "value");
    now = 1_501;

    expect(cache.get("key")).toBeUndefined();
  });

  it("prunes expired entries when reporting size", () => {
    let now = 1_000;
    const cache = new TTLCache<string, string>(200, () => now);

    cache.set("a", "1");
    cache.set("b", "2");
    now = 1_250;

    expect(cache.size()).toBe(0);
  });
});
