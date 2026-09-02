import { z } from "zod";

export const eventDefinitionSchema = z.object({
  key: z.string().min(1).max(160),
  version: z.string().min(1).max(64).optional(),
  direction: z.enum(["produces", "consumes"]),
  topic: z.string().min(1).max(250),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type EventDefinitionManifest = z.infer<typeof eventDefinitionSchema>;
