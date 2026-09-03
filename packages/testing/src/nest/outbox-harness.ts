/**
 * @file outbox-harness.ts
 * @module @stackra/testing/nest
 * @description In-memory transactional-outbox test harness.
 *
 *   Every service that emits domain events via the transactional
 *   outbox pattern (write to `outbox` table inside the same DB
 *   transaction as the aggregate change, drain asynchronously)
 *   needs a way to assert "did this action publish event X?"
 *   without booting the real dispatcher.
 *
 *   The harness:
 *
 *   - Buffers publications in-memory (`.publish(type, payload)`).
 *   - Exposes `.pending()` for pre-drain inspection.
 *   - Simulates a dispatcher via `.drain(handler)` — the handler
 *     runs against each pending row; success marks it published,
 *     throw marks it failed.
 *   - Provides `.assertPublished(type, ?matcher)` — throws with a
 *     descriptive error when no matching row exists.
 */

import { ulid } from "ulid";

/** Statuses a harness row moves through. */
export type OutboxRowStatus = "pending" | "published" | "failed";

/** One buffered publication. */
export interface IOutboxRow<T = unknown> {
  readonly id: string;
  readonly type: string;
  readonly payload: T;
  readonly createdAt: Date;
  status: OutboxRowStatus;
  error?: Error;
}

/** Public harness surface. */
export interface IOutboxHarness {
  /**
   * Buffer a new publication. Assigned a fresh ULID + timestamp.
   * Returns the row so consumers can inspect the assigned ID.
   */
  publish<T>(type: string, payload: T): IOutboxRow<T>;

  /** Every row currently `pending`. Frozen array — safe to iterate. */
  pending(): readonly IOutboxRow[];

  /** Every row (any status). Frozen array. */
  all(): readonly IOutboxRow[];

  /**
   * Drain every pending row through `handler`. Each row that
   * resolves without throwing flips to `published`; each row that
   * throws flips to `failed` and its `.error` is set.
   */
  drain(handler: (row: IOutboxRow) => Promise<void> | void): Promise<void>;

  /**
   * Assert at least one row exists with `type` (and optionally
   * matches `matcher`). Throws a descriptive error otherwise.
   */
  assertPublished(type: string, matcher?: (row: IOutboxRow) => boolean): void;

  /** Reset the harness — every row is discarded. */
  reset(): void;
}

/**
 * Build a fresh outbox harness.
 *
 * @example
 * ```ts
 * const outbox = createOutboxHarness();
 * // ... run production code that calls outbox.publish("user.created", { id: "..." })
 *
 * outbox.assertPublished("user.created");
 * outbox.assertPublished("user.created", (row) => row.payload.id === "abc");
 *
 * await outbox.drain(async (row) => {
 *   await sendToNats(row);
 * });
 * ```
 */
export function createOutboxHarness(): IOutboxHarness {
  const rows: IOutboxRow[] = [];

  return {
    publish<T>(type: string, payload: T): IOutboxRow<T> {
      const row: IOutboxRow<T> = {
        id: ulid(),
        type,
        payload,
        createdAt: new Date(),
        status: "pending",
      };
      rows.push(row);
      return row;
    },

    pending(): readonly IOutboxRow[] {
      return Object.freeze(rows.filter((r) => r.status === "pending"));
    },

    all(): readonly IOutboxRow[] {
      return Object.freeze(rows.slice());
    },

    async drain(handler: (row: IOutboxRow) => Promise<void> | void): Promise<void> {
      for (const row of rows) {
        if (row.status !== "pending") continue;
        try {
          await handler(row);
          row.status = "published";
        } catch (err) {
          row.status = "failed";
          row.error = err instanceof Error ? err : new Error(String(err));
        }
      }
    },

    assertPublished(type: string, matcher?: (row: IOutboxRow) => boolean): void {
      const match = rows.find((r) => r.type === type && (!matcher || matcher(r)));
      if (!match) {
        const seen = rows.map((r) => r.type).join(", ") || "(none)";
        throw new Error(
          `[outbox] Expected a row with type='${type}'${
            matcher ? " matching predicate" : ""
          }, but none was found. Seen types: ${seen}.`,
        );
      }
    },

    reset(): void {
      rows.length = 0;
    },
  };
}
