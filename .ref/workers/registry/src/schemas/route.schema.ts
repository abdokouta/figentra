import { z } from "zod";
import { permissionSchema } from "./permission.schema";

export const routeSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]),
  pathPattern: z.string().startsWith("/"),
  upstream: z.string().url(),
  audience: z.string().min(1).max(200),
  requiredPermission: permissionSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type RouteManifest = z.infer<typeof routeSchema>;
