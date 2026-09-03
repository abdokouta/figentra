/**
 * @file request-context.middleware.ts
 * @description Orchestrator request/correlation context middleware.
 */
import type { Context, Next } from "hono";
import type { OrchestratorBindings } from "../interfaces/orchestrator-bindings.interface";
import type { OrchestratorVariables } from "../interfaces/orchestrator-variables.interface";

/**
 * Establishes request and correlation identifiers for an Orchestrator request.
 *
 * @param c - Hono request context.
 * @param next - Downstream middleware callback.
 */
export async function establishRequestContext(
  c: Context<{ Bindings: OrchestratorBindings; Variables: OrchestratorVariables }>,
  next: Next,
): Promise<void> {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  const correlationId =
    c.req.header("x-correlation-id") ??
    c.req.header("traceparent") ??
    requestId;

  c.set("requestId", requestId);
  c.set("correlationId", correlationId);
  c.header("x-request-id", requestId);
  c.header("x-correlation-id", correlationId);
  await next();
}
