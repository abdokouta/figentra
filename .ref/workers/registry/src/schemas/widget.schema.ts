import { z } from "zod";

export const widgetSchema = z.object({
  key: z.string().min(1).max(160),
  component: z.string().min(1).max(250),
  version: z.string().min(1).max(64).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type WidgetManifest = z.infer<typeof widgetSchema>;
