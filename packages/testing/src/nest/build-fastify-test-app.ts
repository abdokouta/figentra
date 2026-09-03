/**
 * @file build-fastify-test-app.ts
 * @module @stackra/testing/nest
 * @description Boot a `NestFastifyApplication` from a compiled
 *   `TestingModule` (or an uncompiled builder). Handles the Fastify
 *   adapter wiring + `.init()` + `.ready()` gymnastics that trip
 *   every first-time consumer.
 *
 *   Ships a Fastify adapter with `logger: false` by default —
 *   Fastify's default logger is noisy in test output.
 */

import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import type { TestingModule, TestingModuleBuilder } from "@nestjs/testing";

/** Optional overrides for the underlying Fastify adapter. */
export interface IFastifyTestAppOptions {
  /**
   * Enable Fastify's built-in pino logger. `false` (default) hides
   * request/response logs from test output — flip to `true` when
   * debugging a specific integration test.
   */
  readonly logger?: boolean;

  /**
   * Trust proxy headers (`X-Forwarded-For`, etc.). Match your
   * production service's setting — matters for tests that assert
   * on IP-derived behaviour.
   *
   * @default false
   */
  readonly trustProxy?: boolean;
}

/**
 * Type predicate — is `x` a `TestingModuleBuilder` (uncompiled) or
 * a `TestingModule` (compiled)?
 */
function isBuilder(x: unknown): x is TestingModuleBuilder {
  return (
    typeof x === "object" &&
    x !== null &&
    typeof (x as { compile?: unknown }).compile === "function"
  );
}

/**
 * Build a ready `NestFastifyApplication` from a `TestingModule` or
 * a `TestingModuleBuilder`. When passed a builder, `.compile()` is
 * called for you.
 *
 * @example
 * ```ts
 * const module = await createTestingModule({ imports: [AppModule] });
 * const app = await buildFastifyTestApp(module);
 * // ... app is initialised + Fastify is ready
 * ```
 */
export async function buildFastifyTestApp(
  moduleOrBuilder: TestingModule | TestingModuleBuilder,
  options: IFastifyTestAppOptions = {},
): Promise<NestFastifyApplication> {
  const module = isBuilder(moduleOrBuilder) ? await moduleOrBuilder.compile() : moduleOrBuilder;

  const adapter = new FastifyAdapter({
    logger: options.logger ?? false,
    trustProxy: options.trustProxy ?? false,
  });

  const app = module.createNestApplication<NestFastifyApplication>(adapter);

  await app.init();
  // Fastify defers route registration until `.ready()`. Without this
  // await, the first request 404s because the route table is still
  // being populated.
  await app.getHttpAdapter().getInstance().ready();

  return app;
}
