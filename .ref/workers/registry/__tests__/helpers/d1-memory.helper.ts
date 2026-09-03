/**
 * @file d1-memory.helper.ts
 * @description In-memory Cloudflare D1 test double backed by Node 24 node:sqlite.
 */
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export interface MockD1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: {
    duration: number;
    rows_read: number;
    rows_written: number;
  };
}

export class MockD1PreparedStatement {
  private boundValues: unknown[] = [];

  constructor(
    private db: DatabaseSync,
    private sql: string,
  ) {}

  bind(...values: unknown[]): MockD1PreparedStatement {
    const clone = new MockD1PreparedStatement(this.db, this.sql);
    clone.boundValues = values;
    return clone;
  }

  async first<T = unknown>(colName?: string): Promise<T | null> {
    const stmt = this.db.prepare(this.sql);
    const row = stmt.get(...(this.boundValues as (string | number | bigint | Buffer | null)[])) as Record<string, unknown> | undefined;
    if (!row) return null;
    if (colName) return (row[colName] as T) ?? null;
    return row as T;
  }

  async all<T = unknown>(): Promise<MockD1Result<T>> {
    const stmt = this.db.prepare(this.sql);
    const rows = stmt.all(...(this.boundValues as (string | number | bigint | Buffer | null)[])) as T[];
    return {
      results: rows,
      success: true,
      meta: {
        duration: 0,
        rows_read: rows.length,
        rows_written: 0,
      },
    };
  }

  async run<T = unknown>(): Promise<MockD1Result<T>> {
    const stmt = this.db.prepare(this.sql);
    const info = stmt.run(...(this.boundValues as (string | number | bigint | Buffer | null)[]));
    return {
      results: [],
      success: true,
      meta: {
        duration: 0,
        rows_read: 0,
        rows_written: Number(info.changes),
      },
    };
  }
}

export class MockD1Database {
  public db: DatabaseSync;

  constructor() {
    this.db = new DatabaseSync(":memory:");
  }

  prepare(sql: string): MockD1PreparedStatement {
    return new MockD1PreparedStatement(this.db, sql);
  }

  async batch<T = unknown>(statements: MockD1PreparedStatement[]): Promise<MockD1Result<T>[]> {
    const results: MockD1Result<T>[] = [];
    this.db.exec("BEGIN TRANSACTION;");
    try {
      for (const stmt of statements) {
        const res = await stmt.run<T>();
        results.push(res);
      }
      this.db.exec("COMMIT;");
      return results;
    } catch (err) {
      this.db.exec("ROLLBACK;");
      throw err;
    }
  }

  async exec(sql: string): Promise<{ count: number; duration: number }> {
    this.db.exec(sql);
    return { count: 1, duration: 0 };
  }
}

/**
 * Creates a fresh in-memory D1 database with all 12 repository migrations applied.
 */
export function createTestD1Database(migrationsDir?: string): MockD1Database {
  const d1 = new MockD1Database();
  const dir = migrationsDir ?? join(__dirname, "../../database/migrations");
  // oxlint-disable-next-line unicorn/no-array-sort
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .slice()
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(dir, file), "utf8");
    d1.db.exec(sql);
  }

  return d1;
}
