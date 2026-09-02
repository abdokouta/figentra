import { z } from "zod";

export const localizationSchema = z.object({
  key: z.string().min(1).max(160),
  namespace: z.string().min(1).max(160),
  locales: z.array(z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/)).max(100),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type LocalizationManifest = z.infer<typeof localizationSchema>;
