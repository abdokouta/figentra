import { z } from "zod";

export const integrationSchema = z.object({
  key: z.string().min(1).max(160),
  provider: z.string().min(1).max(160),
  kind: z.string().min(1).max(120).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type IntegrationManifest = z.infer<typeof integrationSchema>;
