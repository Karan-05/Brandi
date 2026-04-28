import { buildClassificationMessages, buildRepairMessages } from "@/lib/prompt";
import { ClassificationFailedError, RateLimitedError, TimeoutError } from "@/lib/errors";
import { classificationSchema, type Classification, type ClassificationPromptInput } from "@/lib/types";

const DEFAULT_LLM_TIMEOUT_MS = 12_000;
const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

// Models used when primary classification confidence falls below threshold
const GROQ_FALLBACK_MODEL = "qwen-qwq-32b";
const OPENAI_FALLBACK_MODEL = "gpt-4.1";
const CONFIDENCE_THRESHOLD = 0.65;

const OPENAI_BASE_URL = "https://api.openai.com/v1/chat/completions";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";

type LlmMessage = {
  role: "system" | "user";
  content: string;
};

// OpenAI strict JSON schema — not supported by all providers
const STRICT_JSON_SCHEMA_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "website_classification",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["category", "confidence", "explanation"],
      properties: {
        category: {
          type: "string",
          enum: ["Ecommerce", "Social / UGC", "News / Media", "Other"],
        },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        explanation: { type: "string", minLength: 1, maxLength: 280 },
      },
    },
  },
};

// Groq and other OpenAI-compatible providers use the simpler json_object mode;
// the prompt carries the schema definition and Zod validates the output.
const JSON_OBJECT_FORMAT = { type: "json_object" as const };

export interface LlmProvider {
  classify(input: ClassificationPromptInput): Promise<Classification & { reclassified?: boolean }>;
}

type OpenAiResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
  error?: { message?: string };
};

export class OpenAiLlmProvider implements LlmProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model = DEFAULT_OPENAI_MODEL,
    private readonly timeoutMs = DEFAULT_LLM_TIMEOUT_MS,
    private readonly baseUrl = OPENAI_BASE_URL,
    private readonly responseFormat: object = STRICT_JSON_SCHEMA_FORMAT,
  ) {}

  async classify(input: ClassificationPromptInput): Promise<Classification> {
    const raw = await this.requestJson(buildClassificationMessages(input));

    try {
      return parseClassification(raw);
    } catch {
      const repaired = await this.requestJson(buildRepairMessages(raw));
      return parseClassification(repaired);
    }
  }

  private async requestJson(messages: LlmMessage[]) {
    let response: Response;

    try {
      response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0.1,
          max_completion_tokens: 220,
          response_format: this.responseFormat,
          messages,
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      if (isAbortError(error)) {
        throw new TimeoutError("classification");
      }

      throw new ClassificationFailedError();
    }

    if (response.status === 429) {
      throw new RateLimitedError();
    }

    if (!response.ok) {
      throw new ClassificationFailedError();
    }

    const payload = (await response.json()) as OpenAiResponse;
    const content = payload.choices?.[0]?.message?.content;

    if (typeof content === "string") {
      return content;
    }

    if (Array.isArray(content)) {
      const joined = content
        .map((part) => part.text ?? "")
        .join("")
        .trim();

      if (joined) {
        return joined;
      }
    }

    throw new ClassificationFailedError(payload.error?.message || undefined);
  }
}

export function parseClassification(raw: string) {
  const parsed = JSON.parse(raw) as unknown;
  return classificationSchema.parse(parsed);
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "TimeoutError";
}

// Retries with a stronger fallback model when primary confidence < CONFIDENCE_THRESHOLD.
// Returns the fallback result (which typically has higher confidence) with reclassified=true.
class WithFallbackProvider implements LlmProvider {
  constructor(
    private readonly primary: OpenAiLlmProvider,
    private readonly fallback: OpenAiLlmProvider,
  ) {}

  async classify(
    input: ClassificationPromptInput,
  ): Promise<Classification & { reclassified?: boolean }> {
    const result = await this.primary.classify(input);
    if (result.confidence >= CONFIDENCE_THRESHOLD) return result;
    const fallbackResult = await this.fallback.classify(input);
    return { ...fallbackResult, reclassified: true };
  }
}

export function createGroqProvider(apiKey: string): LlmProvider {
  const primary = new OpenAiLlmProvider(apiKey, DEFAULT_GROQ_MODEL, DEFAULT_LLM_TIMEOUT_MS, GROQ_BASE_URL, JSON_OBJECT_FORMAT);
  const fallback = new OpenAiLlmProvider(apiKey, GROQ_FALLBACK_MODEL, DEFAULT_LLM_TIMEOUT_MS, GROQ_BASE_URL, JSON_OBJECT_FORMAT);
  return new WithFallbackProvider(primary, fallback);
}

export function createDefaultLlmProvider(): LlmProvider {
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    const model = process.env.LLM_MODEL || DEFAULT_GROQ_MODEL;
    const primary = new OpenAiLlmProvider(groqKey, model, DEFAULT_LLM_TIMEOUT_MS, GROQ_BASE_URL, JSON_OBJECT_FORMAT);
    const fallback = new OpenAiLlmProvider(groqKey, GROQ_FALLBACK_MODEL, DEFAULT_LLM_TIMEOUT_MS, GROQ_BASE_URL, JSON_OBJECT_FORMAT);
    return new WithFallbackProvider(primary, fallback);
  }

  const openaiKey = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY;
  if (openaiKey) {
    const model = process.env.LLM_MODEL || DEFAULT_OPENAI_MODEL;
    const primary = new OpenAiLlmProvider(openaiKey, model);
    const fallback = new OpenAiLlmProvider(openaiKey, OPENAI_FALLBACK_MODEL);
    return new WithFallbackProvider(primary, fallback);
  }

  throw new ClassificationFailedError(
    "No LLM API key configured. Set GROQ_API_KEY, OPENAI_API_KEY, or LLM_API_KEY.",
    500,
  );
}
