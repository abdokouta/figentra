/**
 * @file with-transaction.ts
 * @module @stackra/testing/database
 * @description Per-test transaction rollback wrapper.
 *
 *   The canonical database-testing pattern:
 *
 *   1. `BEGIN` a transaction at the start of every test.
 *   2. Run the test body inside the transaction.
 *   3. `ROLLBACK` — no matter what the test did, the database is
 *      identical to its state before the test started.
 *
 *   This helper implements that pattern once so every consumer
 *   gets the guarantee without hand-writing `try/finally` blocks.
 *
 *   Works with PGlite, `pg`, and every driver that exposes a
 *   `.query("BEGIN")` / `.query("ROLLBACK")` shape.
 */

/**
 * Minimal interface a database driver must satisfy to plug into
 * `withTransaction`. Compatible with PGlite, `pg` clients, and any
 * driver exposing `.query(sql)`.
 */
export interface ITransactionCapable {
  query(sql: string, params?: readonly unknown[]): Promise<unknown>;
}

/**
 * Run `fn` inside a database transaction. The transaction is
 * ROLLED BACK when `fn` completes, regardless of whether it
 * resolved or threw — every mutation is discarded.
 *
 * Nested calls are supported via savepoints: an inner
 * `withTransaction(db, ...)` creates a savepoint, runs its body,
 * then releases the savepoint on rollback so the outer
 * transaction's rollback still discards every mutation.
 *
 * @param db - Anything with a `.query(sql)` method (PGlite, pg, ...).
 * @param fn - The test body. Receives the same `db` for
 *   convenience.
 * @returns Whatever `fn` returns (a Promise's resolved value).
 *
 * @example
 * ```ts
 * import { createPgliteDatabase, withTransaction } from "@stackra/testing/database";
 *
 * const pglite = await createPgliteDatabase({
 *   schema: "CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT);",
 * });
 *
 * beforeEach(async () => {
 *   // Every test runs in its own transaction — rolled back after.
 *   await withTransaction(pglite.db, async (tx) => {
 *     await tx.query("INSERT INTO users VALUES ($1, $2)", ["u1", "a@b.c"]);
 *     // ... assertions
 *   });
 * });
 * ```
 */
export async function withTransaction<T, D extends ITransactionCapable>(
  db: D,
  fn: (db: D) => Promise<T>,
): Promise<T> {
  // Use a savepoint-friendly identifier so nested calls compose.
  const savepoint = `stackra_test_${Math.random().toString(36).slice(2, 10)}`;

  // Try to open a savepoint first — if the driver is already inside
  // a transaction, this succeeds. Fall back to BEGIN when it fails
  // (no active transaction).
  let usedBegin = false;
  try {
    await db.query(`SAVEPOINT "${savepoint}"`);
  } catch {
    await db.query("BEGIN");
    usedBegin = true;
  }

  try {
    const result = await fn(db);
    // Test succeeded — still roll back. `withTransaction` is a
    // ROLLBACK primitive by design; consumers who want to persist
    // changes should commit outside the helper.
    if (usedBegin) {
      await db.query("ROLLBACK");
    } else {
      await db.query(`ROLLBACK TO SAVEPOINT "${savepoint}"`);
      await db.query(`RELEASE SAVEPOINT "${savepoint}"`);
    }
    return result;
  } catch (err) {
    // Test threw — still roll back, then re-throw so the test
    // framework sees the failure.
    try {
      if (usedBegin) {
        await db.query("ROLLBACK");
      } else {
        await db.query(`ROLLBACK TO SAVEPOINT "${savepoint}"`);
        await db.query(`RELEASE SAVEPOINT "${savepoint}"`);
      }
    } catch {
      // Suppress rollback failures — the underlying test error is
      // more informative. Log to stderr for operator visibility.
      // eslint-disable-next-line no-console
      console.error("[withTransaction] rollback failed after test error");
    }
    throw err;
  }
}
