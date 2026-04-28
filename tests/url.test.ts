import { describe, expect, it } from "vitest";
import { normalizeAndValidateUrl } from "@/lib/url";

describe("normalizeAndValidateUrl", () => {
  it("normalizes protocol, host, query params, and strips hash", () => {
    const result = normalizeAndValidateUrl(" HTTPS://Example.com:443/store/?b=2&a=1#details ");

    expect(result.normalizedUrl).toBe("https://example.com/store?a=1&b=2");
  });

  it("rejects localhost", () => {
    expect(() => normalizeAndValidateUrl("http://localhost:3000")).toThrow();
  });

  it("rejects internal ipv4 ranges", () => {
    const disallowed = [
      "http://127.0.0.1",
      "http://10.0.0.5",
      "http://172.16.1.10",
      "http://192.168.1.8",
      "http://169.254.10.4",
      "http://169.254.169.254/latest/meta-data",
    ];

    for (const url of disallowed) {
      expect(() => normalizeAndValidateUrl(url)).toThrow();
    }
  });

  it("rejects loopback and unique-local ipv6 addresses", () => {
    const disallowed = ["http://[::1]", "http://[fc00::1]", "http://[fe80::1]"];

    for (const url of disallowed) {
      expect(() => normalizeAndValidateUrl(url)).toThrow();
    }
  });

  it("rejects non-http protocols", () => {
    expect(() => normalizeAndValidateUrl("ftp://example.com")).toThrow();
  });
});
