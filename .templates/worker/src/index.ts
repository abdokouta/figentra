/**
 * @file index.ts
 * @description Entry point for the {{SLUG}} Cloudflare Worker.
 *   Implements the `fetch` handler that Cloudflare's runtime invokes on
 *   every incoming request. Routes are organised under `src/routes/` and
 *   wired into a simple pathname router here.
 *
 * @security
 *   - No secrets in source. Bindings come from Wrangler config + Doppler.
 *   - Every response sets security headers (HSTS, X-Content-Type-Options).
 */

import { handleHealth, handleExample } from "./routes";

export default {
  /**
   * Handles every inbound HTTP request. Routes are dispatched by pathname
   * prefix. Add new routes by creating a handler in `src/routes/` and
   * wiring it into the switch below.
   *
   * @param request - The incoming Request object.
   * @param env     - Typed environment bindings (D1, KV, secrets, etc.).
   * @param ctx     - Execution context (waitUntil, passThroughOnException).
   * @returns A Response.
   */
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // ── Route dispatch ──────────────────────────────────────────────────
    if (path === "/health") {
      return handleHealth(request, env);
    }

    if (path.startsWith("/api/v1/examples")) {
      return handleExample(request, env);
    }

    // ── Default 404 ─────────────────────────────────────────────────────
    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
