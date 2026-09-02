/**
 * @file authentication.middleware.ts
 * @description Orchestrator Identity token validation middleware.
 */
import type { Context, Next } from "hono";
import { verifyInfrastructurePrincipal } from "../services/auth.service";
import type { OrchestratorBindings } from "../interfaces/orchestrator-bindings.interface";
import type { OrchestratorVariables } from "../interfaces/orchestrator-variables.interface";

/**
 * Authenticates a protected Orchestrator request.
 *
 * @security The principal is verified once at the boundary and then consumed
 * by route authorization logic.
 */
export async function authenticateInfrastructureRequest(
  c: Context<{ Bindings: OrchestratorBindings; Variables: OrchestratorVariables }>,
  next: Next,
): Promise<Response | void> {
  try {
    const principal = await verifyInfrastructurePrincipal(c.req.raw, c.env);
    c.set("principal", principal);
    await next();
  } catch {
    return c.json(
      { error: "unauthorized", requestId: c.get("requestId") },
      401,
    );
  }
}
