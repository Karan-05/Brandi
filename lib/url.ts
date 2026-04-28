import { isIP } from "node:net";
import { InvalidUrlError } from "@/lib/errors";

const METADATA_IP = "169.254.169.254";

export function normalizeAndValidateUrl(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new InvalidUrlError();
  }

  let url: URL;

  try {
    url = new URL(trimmed);
  } catch {
    throw new InvalidUrlError();
  }

  const protocol = url.protocol.toLowerCase();

  if (protocol !== "http:" && protocol !== "https:") {
    throw new InvalidUrlError("Please enter a valid public URL using http or https.");
  }

  if (url.username || url.password) {
    throw new InvalidUrlError("Embedded credentials are not allowed in submitted URLs.");
  }

  const hostname = url.hostname.toLowerCase();
  const bareHostname = stripIpv6Brackets(hostname);

  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new InvalidUrlError();
  }

  if (bareHostname === METADATA_IP || isPrivateOrInternalHost(bareHostname)) {
    throw new InvalidUrlError();
  }

  url.protocol = protocol;
  url.hostname = hostname;
  url.hash = "";

  if ((url.protocol === "http:" && url.port === "80") || (url.protocol === "https:" && url.port === "443")) {
    url.port = "";
  }

  url.pathname = normalizePathname(url.pathname);
  url.search = normalizeSearch(url.searchParams);

  return {
    submittedUrl: trimmed,
    normalizedUrl: url.toString(),
  };
}

function normalizePathname(pathname: string) {
  const collapsed = pathname.replace(/\/{2,}/g, "/");

  if (collapsed === "/") {
    return "/";
  }

  return collapsed.replace(/\/+$/g, "") || "/";
}

function normalizeSearch(params: URLSearchParams) {
  const sorted = [...params.entries()].sort(([keyA, valueA], [keyB, valueB]) => {
    if (keyA === keyB) {
      return valueA.localeCompare(valueB);
    }

    return keyA.localeCompare(keyB);
  });

  if (sorted.length === 0) {
    return "";
  }

  return `?${new URLSearchParams(sorted).toString()}`;
}

function stripIpv6Brackets(hostname: string) {
  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    return hostname.slice(1, -1);
  }

  return hostname;
}

function isPrivateOrInternalHost(hostname: string): boolean {
  const ipVersion = isIP(hostname);

  if (ipVersion === 4) {
    return isPrivateIpv4(hostname);
  }

  if (ipVersion === 6) {
    return isPrivateIpv6(hostname);
  }

  return false;
}

function isPrivateIpv4(ip: string): boolean {
  const octets = ip.split(".").map((value) => Number.parseInt(value, 10));
  const [a, b] = octets;

  if (ip === METADATA_IP || ip === "0.0.0.0") {
    return true;
  }

  if (a === 127 || a === 10) {
    return true;
  }

  if (a === 169 && b === 254) {
    return true;
  }

  if (a === 192 && b === 168) {
    return true;
  }

  if (a === 172 && b >= 16 && b <= 31) {
    return true;
  }

  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  if (normalized === "::1") {
    return true;
  }

  if (normalized.startsWith("::ffff:")) {
    return isPrivateOrInternalHost(normalized.replace("::ffff:", ""));
  }

  if (/^f[c-d]/.test(normalized)) {
    return true;
  }

  if (/^fe[89ab]/.test(normalized)) {
    return true;
  }

  return false;
}
