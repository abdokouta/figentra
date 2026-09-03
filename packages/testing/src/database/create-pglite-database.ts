/**
 * @file create-pglite-database.ts
 * @module @stackra/testing/database
 * @description Per-test PGlite Postgres fixture. `@electric-sql/pglite`
 *   runs a full PostgreSQL server in-process (WASM), so every test
 *   gets an isolated Postgres — no shared server, no port
 *   collisions, no test-suite ordering surprises.
 *
 *   Two shapes:
 *
 *   - `createPgliteDatabase({ schema })` — one-shot factory returning
 *     the PGlite instance + helpers.
 *   - `createPgliteDatabase({ extensions })` — enable Postgres
 *     extensions (`pgvector`, `uuid-ossp`, `pgcrypto`) that PGlite
 *     ships as separate WASM modules.
 *
 *   Bring-your-own-migrations: run schema DDL via
 *   `db.exec("CREATE TABLE ...")` before your test asserts.
 */

import { PGlite, type Extensions } from "@electric-sql/pglite";

/** Options for `createPgliteDatabase`. */
export interface ICreatePgliteDatabaseOptions {
  /**
   * SQL DDL executed at boot. Semicolon-separated statements are
   * supported (PGlite handles the split internally via `.exec`).
   *
   * Prefer schema-per-file over a single mega-string; use
   * `migrations` for that.
   */
  readonly schema?: string;

  /**
   * Ordered migration list. Each entry is a SQL string executed
   * via `.exec()`. Preferred over `schema` for anything larger
   * than a handful of statements — every migration surfaces in
   * error messages by its array index.
   */
  readonly migrations?: readonly string[];

  /**
   * PGlite extensions to load. Each extension ships as a separate
   * WASM module; the consumer imports the extension package and
   * passes its export here.
   *
   * @example
   * ```ts
   * import { vector } from "@electric-sql/pglite/vector";
   * const db = await createPgliteDatabase({ extensions: { vector } });
   * ```
   */
  readonly extensions?: Extensions;

  /**
   * Optional `dataDir` — pass `"memory://"` (default) for a
   * throw-away in-memory database, or a real filesystem path to
   * persist state across process restarts (rare in tests).
   *
   * @default "memory://"
   */
  readonly dataDir?: string;
}

/** Handle for a per-test PGlite database. */
export interface IPgliteDatabase {
  /** The underlying `PGlite` instance. */
  readonly db: PGlite;

  /** Convenience — parameterised query with typed row output. */
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<{ rows: T[]; affectedRows: number }>;

  /** Convenience — non-returning statement (DDL, INSERT, ...). */
  exec(sql: string): Promise<void>;

  /**
   * Delete every row from every user table. Faster than dropping +
   * recreating the database between tests.
   *
   * Uses `TRUNCATE ... RESTART IDENTITY CASCADE` on every table
   * discovered via `information_schema.tables`.
   */
  reset(): Promise<void>;

  /** Close the database. Idempotent. */
  dispose(): Promise<void>;
}

/**
 * Build a fresh in-process Postgres.
 *
 * @example
 * ```ts
 * const db = await createPgliteDatabase({
 *   schema: `
 *     CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL);
 *     CREATE INDEX users_email_idx ON users(email);
 *   `,
 * });
 *
 * await db.query(
 *   "INSERT INTO users (id, email) VALUES ($1, $2)",
 *   ["u1", "alice@example.com"],
 * );
 *
 * const { rows } = await db.query<{ id: string; email: string }>(
 *   "SELECT id, email FROM users",
 * );
 * expect(rows).toHaveLength(1);
 *
 * await db.dispose();
 * ```
 */
export async function createPgliteDatabase(
  options: ICreatePgliteDatabaseOptions = {},
): Promise<IPgliteDatabase> {
  const {
    schema,
    migrations = [],
    extensions,
    dataDir = "memory://",
  } = options;

  const db = new PGlite(dataDir, extensions ? { extensions } : undefined);
  await db.waitReady;

  const applyStatements = async (sql: string): Promise<void> => {
    // PGlite's `.exec()` handles multi-statement strings, but
    // splitting client-side gives clearer error messages when a
    // single statement fails.
    const statements = sql
      .split(/;\s*(?=\S)/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    for (const stmt of statements) {
      await db.exec(stmt);
    }
  };

  if (schema) await applyStatements(schema);
  for (const migration of migrations) await applyStatements(migration);

  let disposed = false;

  return {
    db,

    async query<T extends Record<string, unknown> = Record<string, unknown>>(
      sql: string,
      params?: readonly unknown[],
    ): Promise<{ rows: T[]; affectedRows: number }> {
      const result = await db.query<T>(sql, params ? [...params] : undefined);
      return {
        rows: result.rows,
        affectedRows: result.affectedRows ?? 0,
      };
    },

    async exec(sql: string): Promise<void> {
      await db.exec(sql);
    },

    async reset(): Promise<void> {
      // Discover every user table in the public schema.
      const { rows } = await db.query<{ tablename: string }>(
        `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
      );
      if (rows.length === 0) return;

      // TRUNCATE ... CASCADE handles FK dependencies in one shot;
      // RESTART IDENTITY resets any auto-increment sequences.
      const tables = rows
        .map((r) => `"${r.tablename}"`)
        .join(", ");
      await db.exec(
        `TRUNCATE ${tables} RESTART IDENTITY CASCADE`,
      );
    },

    async dispose(): Promise<void> {
      if (disposed) return;
      disposed = true;
      await db.close();
    },
  };
}
