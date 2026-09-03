/**
 * @file index.ts
 * @module @stackra/testing/database
 * @description Public API barrel for the database test toolkit.
 *
 *   Every export requires the optional peer `@electric-sql/pglite`
 *   (for the PGlite fixture) and/or `@mikro-orm/core` (for the
 *   EntityManager helper). Consumers who don't use either never
 *   install the peers; importing this subpath without them fails
 *   at test boot with a clear "Cannot find module '...'" error.
 */

export {
  createPgliteDatabase,
  type ICreatePgliteDatabaseOptions,
  type IPgliteDatabase,
} from "./create-pglite-database";
export { createTestEntityManager, type ITestEntityManager } from "./create-test-entity-manager";
export { withTransaction, type ITransactionCapable } from "./with-transaction";
