import { z } from "zod";
import { permissionSchema } from "./permission.schema";

export const moduleSchema = z.object({
  key: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const resourceSchema = z.object({
  moduleKey: z.string().min(1).max(120),
  key: z.string().min(1).max(120),
  label: z.string().max(200).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const actionSchema = z.object({
  resourceKey: z.string().min(1).max(120),
  key: z.string().min(1).max(120),
  permission: permissionSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type ModuleManifest = z.infer<typeof moduleSchema>;
export type ResourceManifest = z.infer<typeof resourceSchema>;
export type ActionManifest = z.infer<typeof actionSchema>;
