import { z } from "zod";

export const featureSchema = z.object({
  key: z.string().min(1).max(160),
  defaultEnabled: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type FeatureManifest = z.infer<typeof featureSchema>;
