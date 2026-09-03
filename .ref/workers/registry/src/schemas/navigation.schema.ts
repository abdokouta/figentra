import { z } from "zod";
import { permissionSchema } from "./permission.schema";

export const navigationSchema = z.object({
  key: z.string().min(1).max(120),
  path: z.string().startsWith("/").max(500),
  label: z.string().max(200).optional(),
  icon: z.string().max(120).optional(),
  permission: permissionSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type NavigationManifest = z.infer<typeof navigationSchema>;
