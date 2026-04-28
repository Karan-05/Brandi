import { z } from "zod";

export const CATEGORY_VALUES = ["Ecommerce", "Social / UGC", "News / Media", "Other"] as const;

export const categorySchema = z.enum(CATEGORY_VALUES);

export const classificationSchema = z.object({
  category: categorySchema,
  confidence: z.number().min(0).max(1),
  explanation: z.string().trim().min(1).max(280),
});

export const timingSchema = z.object({
  scrape: z.number().int().nonnegative(),
  classify: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

export const classifySuccessSchema = classificationSchema.extend({
  submittedUrl: z.string().url(),
  normalizedUrl: z.string().url(),
  cached: z.boolean(),
  reclassified: z.boolean().optional(),
  timingMs: timingSchema.optional(),
});

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.enum(["INVALID_URL", "SCRAPE_FAILED", "CLASSIFICATION_FAILED", "RATE_LIMITED", "UNKNOWN"]),
    message: z.string().min(1),
  }),
});

export type Category = z.infer<typeof categorySchema>;
export type Classification = z.infer<typeof classificationSchema>;
export type ClassifyApiSuccess = z.infer<typeof classifySuccessSchema>;
export type ClassifyApiError = z.infer<typeof apiErrorSchema>;

export type ScrapedPage = {
  title?: string;
  description?: string;
  markdown?: string;
  text: string;
};

export type ClassificationPromptInput = {
  url: string;
  page: ScrapedPage;
};
