import { z } from "zod";

export const settingSchema = z.object({
  key: z.string().min(1).max(160),
  type: z.enum(["string", "number", "boolean", "json", "enum"]),
  required: z.boolean().optional(),
  sensitive: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type SettingManifest = z.infer<typeof settingSchema>;
