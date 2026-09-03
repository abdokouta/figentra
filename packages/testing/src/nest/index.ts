/**
 * @file index.ts
 * @module @stackra/testing/nest
 * @description Public API barrel for the NestJS test toolkit.
 *
 *   Every export requires the NestJS optional peers
 *   (`@nestjs/testing`, `@nestjs/platform-fastify`, `supertest`).
 *   Consumers who don't use NestJS never install these; importing
 *   this subpath without them fails loudly at test boot with a
 *   clear "Cannot find module '@nestjs/testing'" error.
 */

export { buildFastifyTestApp, type IFastifyTestAppOptions } from "./build-fastify-test-app";
export {
  createNestTestContext,
  type ICreateNestTestContextOptions,
} from "./create-nest-test-context";
export { createTestingModule, type INestTestingModuleOptions } from "./create-testing-module";
export {
  createOutboxHarness,
  type IOutboxHarness,
  type IOutboxRow,
  type OutboxRowStatus,
} from "./outbox-harness";
export { supertestClient } from "./supertest-client";
export type { INestTestContext } from "./testing-context.interface";
