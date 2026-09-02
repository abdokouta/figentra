/**
 * @file request-context.middleware.ts
 * @description Registry request/correlation context middleware.
 */
import type { Context, Next } from "hono";
import type { RegistryBindings } from "../interfaces/registry-bindings.interface.js";
import type { RegistryVariables } from "../interfaces/registry-variables.interface.js";

/**
 * Establishes request and correlation identifiers.
 *
 * @param c - Hono request context.
 * @param next - Downstream middleware callback.
 */
export async function establishRequestContext(
  c: Context<{ Bindings: RegistryBindings; Variables: RegistryVariables }>,
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
