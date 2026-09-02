import { z } from "zod";
import { permissionSchema } from "./permission.schema";

export const workflowDefinitionSchema = z.object({
  key: z.string().min(1).max(160),
  version: z.string().min(1).max(64).optional(),
  description: z.string().max(1000).optional(),
  runtime: z.literal("cloudflare-workflow"),
  worker: z.string().min(1).max(160),
  binding: z.string().min(1).max(160).optional(),
  trigger: z.record(z.string(), z.unknown()).optional(),
  permissions: z.array(permissionSchema).max(100).optional(),
  retry: z.record(z.string(), z.unknown()).optional(),
  timeout: z.string().max(64).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type WorkflowDefinitionManifest = z.infer<typeof workflowDefinitionSchema>;
