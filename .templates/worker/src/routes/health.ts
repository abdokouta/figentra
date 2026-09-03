/**
 * @file health.ts
 * @module {{PACKAGE_NAME}}/routes
 * @description Health probe route. Returns a JSON status response for the
 *   container platform's liveness/readiness checks.
 *
 *   This is the only route shipped with the template. Add more route files
 *   under `src/routes/` and wire them in `src/index.ts`.
 */

/**
 * Handle a health probe request.
 *
 * @param _request - The incoming Request (unused — health is unconditional).
 * @param env      - Typed Worker environment bindings.
 * @returns A 200 JSON response with the worker's identity.
 */
export function handleHealth(_request: Request, env: Env): Response {
  return Response.json({
    status: "alive",
    worker: "{{SLUG}}",
    environment: env.FIGENTRA_ENV ?? "unknown",
  });
}
