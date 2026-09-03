/**
 * @file create-test-entity-manager.ts
 * @module @stackra/testing/database
 * @description MikroORM `EntityManager` helper for tests.
 *
 *   The canonical MikroORM test pattern:
 *
 *   ```ts
 *   const orm = await MikroORM.init({ ... });
 *   const em = orm.em.fork();
 *   await em.begin();
 *   // ... test body operates against `em`
 *   await em.rollback();
 *   ```
 *
 *   This helper wraps steps 2 through 4 in one call. Consumers
 *   bring their own `MikroORM` instance (typically constructed
 *   once per suite in `beforeAll`) and call
 *   `createTestEntityManager(orm)` per test.
 *
 *   Task 11 of `.kiro/plans/2026-09-03-workspace-standardization.md`
 *   ships `@stackra/database/nest` with the workspace-canonical
 *   MikroORM boot; this helper composes onto that once it lands.
 */

import type { EntityManager, MikroORM } from "@mikro-orm/core";

/** Handle for a per-test EntityManager. */
export interface ITestEntityManager {
  /**
   * The forked EntityManager, inside a transaction. Every write
   * goes into the transaction; nothing hits committed storage.
   */
  readonly em: EntityManager;

  /**
   * Commit the transaction. Rare — most tests rollback. Useful
   * when a test genuinely wants to persist data for a follow-up
   * assertion in a downstream test (avoid: usually indicates the
   * test is doing too much).
   */
  commit(): Promise<void>;

  /**
   * Roll back the transaction. Every mutation is discarded. This
   * is the default cleanup — call it in `afterEach`.
   *
   * Idempotent — safe to call after `commit()` (no-op) or
   * multiple times in the same afterEach path.
   */
  rollback(): Promise<void>;
}

/**
 * Fork a MikroORM `EntityManager` and start a transaction on it.
 * Return a handle that lets the test roll back / commit.
 *
 * @param orm - A MikroORM instance (typically bootstrapped once
 *   per test suite in `beforeAll`).
 *
 * @example
 * ```ts
 * import { MikroORM } from "@mikro-orm/core";
 * import { createTestEntityManager } from "@stackra/testing/database";
 *
 * let orm: MikroORM;
 *
 * beforeAll(async () => {
 *   orm = await MikroORM.init({ ... });
 * });
 * afterAll(() => orm.close());
 *
 * let ctx: ITestEntityManager;
 * beforeEach(async () => { ctx = await createTestEntityManager(orm); });
 * afterEach(async () => { await ctx.rollback(); });
 *
 * test("persists a user", async () => {
 *   const user = ctx.em.create(User, { email: "a@b.c" });
 *   await ctx.em.persistAndFlush(user);
 *   const found = await ctx.em.findOne(User, { email: "a@b.c" });
 *   expect(found).not.toBeNull();
 * });
 * ```
 */
export async function createTestEntityManager(orm: MikroORM): Promise<ITestEntityManager> {
  const em = orm.em.fork();
  await em.begin();

  let finished = false;

  return {
    em,
    async commit(): Promise<void> {
      if (finished) return;
      finished = true;
      await em.commit();
    },
    async rollback(): Promise<void> {
      if (finished) return;
      finished = true;
      await em.rollback();
    },
  };
}
