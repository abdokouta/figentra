import { z } from "zod";

export const environmentSchema = z.object({
  environment: z.string().min(1).max(64),
  deploymentUrl: z.string().url().max(500),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type EnvironmentManifest = z.infer<typeof environmentSchema>;
