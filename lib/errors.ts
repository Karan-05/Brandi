export type ErrorCode = "INVALID_URL" | "SCRAPE_FAILED" | "CLASSIFICATION_FAILED" | "RATE_LIMITED" | "UNKNOWN";

export class AppError extends Error {
  code: ErrorCode;
  statusCode: number;

  constructor(code: ErrorCode, message: string, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class InvalidUrlError extends AppError {
  constructor(message = "Please enter a valid public URL.") {
    super("INVALID_URL", message, 400);
  }
}

export class ScrapeFailedError extends AppError {
  constructor(message = "We could not read this page. It may block scraping.", statusCode = 502) {
    super("SCRAPE_FAILED", message, statusCode);
  }
}

export class ClassificationFailedError extends AppError {
  constructor(message = "The classifier could not process this page. Please try again.", statusCode = 502) {
    super("CLASSIFICATION_FAILED", message, statusCode);
  }
}

export class TimeoutError extends AppError {
  constructor(scope: "scrape" | "classification") {
    super(
      scope === "scrape" ? "SCRAPE_FAILED" : "CLASSIFICATION_FAILED",
      scope === "scrape"
        ? "We could not read this page in time. Please try again."
        : "The classifier took too long to respond. Please try again.",
      504,
    );
  }
}

export class RateLimitedError extends AppError {
  constructor(message = "The classifier is temporarily rate limited. Please try again shortly.") {
    super("RATE_LIMITED", message, 429);
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      body: {
        error: {
          code: error.code,
          message: error.message,
        },
      },
    };
  }

  return {
    status: 500,
    body: {
      error: {
        code: "UNKNOWN" as const,
        message: "The classifier could not process this page. Please try again.",
      },
    },
  };
}
