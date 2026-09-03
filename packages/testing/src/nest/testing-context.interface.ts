/**
 * @file testing-context.interface.ts
 * @module @stackra/testing/nest
 * @description Composed NestJS test-context shape.
 *
 *   A `INestTestContext` bundles the three moving parts of every
 *   NestJS integration test:
 *
 *   - `module` — the compiled `TestingModule` (DI graph).
 *   - `app` — the initialised `NestFastifyApplication` (ready to
 *     accept HTTP requests).
 *   - `client` — a supertest agent bound to the app's underlying
 *     HTTP server; sends real requests, receives real responses.
 *
 *   Consumers destructure what they need and forget the rest.
 *   `close()` tears down the app + fastify adapter + DI graph in
 *   one call — idempotent, safe to call in `afterEach`.
 */

import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import type { TestingModule } from "@nestjs/testing";
import type { Agent as SuperTestAgent } from "supertest";

/**
 * Composed NestJS integration-test context.
 *
 * Every field is `readonly` — mutating the module or app from a
 * test is almost always a bug (it means the test is reaching
 * behind the abstraction). Use `.close()` to release resources.
 */
export interface INestTestContext {
  /** Compiled DI graph. Use `.get(token)` to fetch providers. */
  readonly module: TestingModule;

  /** Initialised NestJS + Fastify app. `.getHttpServer()` returns the underlying Node server. */
  readonly app: NestFastifyApplication;

  /**
   * Supertest agent bound to the app. Chain HTTP verbs directly:
   *
   * ```ts
   * const res = await context.client
   *   .post("/users")
   *   .send({ email: "alice@example.com" })
   *   .expect(201);
   * ```
   */
  readonly client: SuperTestAgent;

  /**
   * Shut down the app, close the Fastify listener, dispose the DI
   * graph. Safe to call multiple times.
   */
  close(): Promise<void>;
}
