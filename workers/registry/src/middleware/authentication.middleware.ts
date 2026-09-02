/**
 * @file authentication.middleware.ts
 * @description Registry Identity JWT verification middleware.
 */
import type { Context, Next } from "hono";
import { verifyRegistryToken } from "../security/jwt-verifier.js";
import type { RegistryBindings } from "../interfaces/registry-bindings.interface.js";
import type { RegistryVariables } from "../interfaces/registry-variables.interface.js";

/**
 * Authenticates all protected Registry requests.
 *
 * @security Route modules remain responsible for exact principal, audience and
 * permission checks.
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
    return c.json(
      { error: "unauthorized", requestId: c.get("requestId") },
      401,
    );
  }
}
