/**
 * @file create-nest-test-context.ts
 * @module @stackra/testing/nest
 * @description One-call factory for a full NestJS integration
 *   context — compiles the module, boots Fastify, wires supertest,
 *   and returns `INestTestContext`.
 *
 *   The workspace convention every service test converges on:
 *
 *   ```ts
 *   let ctx: INestTestContext;
 *
 *   beforeAll(async () => {
 *     ctx = await createNestTestContext({
 *       imports: [AppModule],
 *       overrides: [[LOGGER_MANAGER, createMockLogger()]],
 *     });
 *   });
 *
 *   afterAll(() => ctx.close());
 *
 *   test("GET /health returns 200", async () => {
 *     await ctx.client.get("/health").expect(200);
 *   });
 *   ```
 */

import {
  buildFastifyTestApp,
  type IFastifyTestAppOptions,
} from "./build-fastify-test-app";
import {
  createTestingModule,
  type INestTestingModuleOptions,
} from "./create-testing-module";
import { supertestClient } from "./supertest-client";
import type { INestTestContext } from "./testing-context.interface";

/** Union of `INestTestingModuleOptions` + `IFastifyTestAppOptions`. */
export interface ICreateNestTestContextOptions
  extends INestTestingModuleOptions,
    IFastifyTestAppOptions {}

/**
 * Build a ready-to-use `INestTestContext`.
 *
 * Composes:
 *
 *   1. `createTestingModule(...)` — DI graph with overrides.
 *   2. `.compile()` — resolve every provider.
 *   3. `buildFastifyTestApp(...)` — boot Fastify + `.init()`.
 *   4. `supertestClient(...)` — bind a supertest agent.
 *
 * The resulting context bundles all three for downstream test
 * code. Call `context.close()` in `afterAll` / `afterEach`.
 */
export async function createNestTestContext(
  options: ICreateNestTestContextOptions,
): Promise<INestTestContext> {
  const { logger, trustProxy, ...moduleOptions } = options;
  const builder = createTestingModule(moduleOptions);
  const module = await builder.compile();
  const app = await buildFastifyTestApp(module, { logger, trustProxy });
  const client = supertestClient(app);

  let closed = false;

  return {
    module,
    app,
    client,
    async close(): Promise<void> {
      if (closed) return;
      closed = true;
      // Order matters: close the app (releases the Fastify
      // listener) BEFORE disposing the DI graph. Reversing the
      // order occasionally leaves the port in TIME_WAIT.
      await app.close();
      await module.close();
    },
  };
}
