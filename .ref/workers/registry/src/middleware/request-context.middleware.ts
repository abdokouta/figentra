/**
 * @file request-context.middleware.ts
 * @description Request tracking middleware injecting correlation and request identifiers.
 */

import type { Context, Next } from "hono";
import type { RegistryBindings } from "../interfaces/registry-bindings.interface";
import type { RegistryVariables } from "../interfaces/registry-variables.interface";

/**
 * Establishes request and correlation identifiers on the Hono context and response headers.
 *
 * @param c - Hono request context.
 * @param next - Next middleware handler.
 */
export async function establishRequestContext(
  c: Context<{ Bindings: RegistryBindings; Variables: RegistryVariables }>,
  next: Next,
): Promise<void> {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  const correlationId =
    c.req.header("x-correlation-id") ?? c.req.header("traceparent") ?? requestId;

  c.set("requestId", requestId);
  c.set("correlationId", correlationId);
  c.header("x-request-id", requestId);
  c.header("x-correlation-id", correlationId);
  await next();
}
