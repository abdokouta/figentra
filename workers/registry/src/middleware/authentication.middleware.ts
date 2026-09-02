/**
 * @file authentication.middleware.ts
 * @description Authentication middleware verifying incoming JWT tokens for protected routes.
 */

import type { Context, Next } from "hono";
import { verifyRegistryToken } from "../security/jwt-verifier";
import type { RegistryBindings } from "../interfaces/registry-bindings.interface";
import type { RegistryVariables } from "../interfaces/registry-variables.interface";

/**
 * Authenticates requests to /v1/* endpoints by verifying the Bearer token.
 * Populates `registryClaims` on the Hono context for downstream route authorization.
 *
 * @param c - Hono request context.
 * @param next - Next middleware handler.
 */
export async function authenticateRegistryRequest(
  c: Context<{ Bindings: RegistryBindings; Variables: RegistryVariables }>,
  next: Next,
): Promise<Response | void> {
  try {
    const claims = await verifyRegistryToken(c.req.raw, c.env, [
      c.env.IDENTITY_AUDIENCE,
      c.env.REGISTRY_REGISTRATION_AUDIENCE,
      c.env.REGISTRY_ROUTE_RESOLUTION_AUDIENCE,
    ]);
    c.set("registryClaims", claims);
    await next();
  } catch {
    return c.json({ error: "unauthorized", requestId: c.get("requestId") }, 401);
  }
}
