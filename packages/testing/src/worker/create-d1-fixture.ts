/**
 * @file create-d1-fixture.ts
 * @module @stackra/testing/worker
 * @description Per-test D1 database fixture. Uses Miniflare's
 *   D1 simulator — an in-memory SQLite database that mirrors the
 *   D1 API surface (`.prepare()` / `.exec()` / `.batch()`).
 *
 *   Every fixture is isolated: two tests each call
 *   `createD1Fixture()` and get two independent SQLite databases.
 *   No shared state, no cleanup required beyond `.dispose()`.
 *
 *   Optional `schema` argument runs a SQL string at boot — the
 *   fastest way to seed tables + indexes for a test.
 */

import { Miniflare } from "miniflare";
import type { D1Database } from "@cloudflare/workers-types";

/** Options for `createD1Fixture`. */
export interface ICreateD1FixtureOptions {
  /**
   * SQL statements executed before the fixture is returned. Use
   * for schema setup: `CREATE TABLE`, `CREATE INDEX`,
   * `INSERT INTO ... (seed data)`.
   *
   * Multiple statements can be separated by semicolons — every
   * `.exec(schema)` call splits on `;` and runs each fragment.
   */
  readonly schema?: string;

  /**
   * Migrations to run at boot, in order. Each entry is executed
   * via `.exec()` — same semantics as `schema`, but expressed as
   * an ordered array for readability.
   */
  readonly migrations?: readonly string[];
}

/** Handle for a per-test D1 database. */
export interface ID1Fixture {
  /** The `D1Database` binding — pass to production code under test. */
  readonly db: D1Database;
  /** Access the underlying Miniflare instance for direct inspection. */
  readonly mf: Miniflare;
  /**
   * Wipe every table in the database. Faster than recreating the
   * fixture when a test needs a clean slate between assertions.
   *
   * Uses `DROP TABLE` in reverse dependency order (best-effort via
   * `sqlite_master` scan).
   */
  reset(): Promise<void>;
  /** Release the Miniflare instance. Safe to call multiple times. */
  dispose(): Promise<void>;
}

/**
 * Build a fresh D1 database backed by an in-memory SQLite.
 *
 * @example
 * ```ts
 * const d1 = await createD1Fixture({
 *   schema: `
 *     CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL);
 *     CREATE INDEX users_email_idx ON users(email);
 *   `,
 * });
 *
 * await d1.db
 *   .prepare("INSERT INTO users (id, email) VALUES (?, ?)")
 *   .bind("u1", "alice@example.com")
 *   .run();
 *
 * const { results } = await d1.db.prepare("SELECT * FROM users").all();
 * expect(results).toHaveLength(1);
 *
 * await d1.dispose();
 * ```
 */
export async function createD1Fixture(options: ICreateD1FixtureOptions = {}): Promise<ID1Fixture> {
  const mf = new Miniflare({
    // Miniflare requires SOME script to boot; a stub Worker that
    // never runs is fine because we only need the D1 binding.
    modules: true,
    script: "export default { async fetch() { return new Response('ok'); } }",
    compatibilityDate: "2026-09-01",
    d1Databases: ["DB"],
  });

  await mf.ready;
  const db = (await mf.getD1Database("DB")) as unknown as D1Database;

  const applyStatements = async (sql: string): Promise<void> => {
    // D1 `exec()` runs multiple statements separated by semicolons.
    // Splitting client-side gives clearer error messages when a
    // single statement fails.
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    for (const stmt of statements) {
      await db.exec(stmt);
    }
  };

  if (options.schema) {
    await applyStatements(options.schema);
  }

  for (const migration of options.migrations ?? []) {
    await applyStatements(migration);
  }

  let disposed = false;

  return {
    db,
    mf,
    async reset(): Promise<void> {
      const { results } = await db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'",
        )
        .all<{ name: string }>();
      for (const row of results ?? []) {
        await db.exec(`DELETE FROM ${row.name}`);
      }
    },
    async dispose(): Promise<void> {
      if (disposed) return;
      disposed = true;
      await mf.dispose();
    },
  };
}
