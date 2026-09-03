/**
 * @file supertest-client.ts
 * @module @stackra/testing/nest
 * @description supertest client factory — binds a supertest agent
 *   to a running `NestFastifyApplication`'s underlying HTTP server.
 *
 *   Consumers use it exactly like the raw `request(app)` invocation
 *   most Nest guides show — the helper exists to give a stable
 *   name that survives supertest version bumps.
 */

import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import request, { type Agent as SuperTestAgent } from "supertest";

/**
 * Return a supertest agent bound to the app's HTTP server.
 *
 * @example
 * ```ts
 * const client = supertestClient(app);
 * const res = await client
 *   .get("/health")
 *   .expect(200)
 *   .expect("Content-Type", /json/);
 * expect(res.body).toEqual({ ok: true });
 * ```
 */
export function supertestClient(app: NestFastifyApplication): SuperTestAgent {
  return request(app.getHttpServer());
}
