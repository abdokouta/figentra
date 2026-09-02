/**
 * @file mikro-orm.ts
 * @description PostgreSQL/MikroORM implementation of the Figentra transactional
 * outbox store.
 *
 * Claiming uses PostgreSQL row locks with `FOR UPDATE SKIP LOCKED` so multiple
 * relay instances can process the same service's outbox concurrently without
 * taking the same event. Each service owns its own outbox tables.
 */
import type { EntityManager } from "@mikro-orm/core";
import type { OutboxRecord } from "./index";
import type { OutboxRelayStore } from "./relay";

/**
 * PostgreSQL outbox persistence adapter.
 */
export class MikroOrmOutboxStore implements OutboxRelayStore {
  /**
   * @param em - MikroORM EntityManager configured for the owning service DB.
   */
  public constructor(private readonly em: EntityManager) { }

  /** Claims pending rows without allowing another relay to claim the same row. */
  public async claim(limit: number): Promise<readonly OutboxRecord[]> {
    return this.em.transactional(async (tx) => {
      const rows = await tx.getConnection().execute<RawOutboxRow[]>(
        `
        WITH candidates AS (
          SELECT id
          FROM outbox_events
          WHERE published_at IS NULL
            AND (next_attempt_at IS NULL OR next_attempt_at <= now())
          ORDER BY created_at ASC
          LIMIT ?
          FOR UPDATE SKIP LOCKED
        )
        UPDATE outbox_events o
        SET attempts = o.attempts + 1
        FROM candidates c
        WHERE o.id = c.id
        RETURNING o.*
        `,
        [limit],
      );

      return rows.map(toRecord);
    });
  }

  /** Marks a successfully published event. */
  public async markPublished(id: string, publishedAt: Date): Promise<void> {
    await this.em.getConnection().execute(
      `UPDATE outbox_events SET published_at = ?, last_error = NULL WHERE id = ?`,
      [publishedAt, id],
    );
  }

  /** Records a retryable failure and schedules the next attempt. */
  public async markFailed(
    id: string,
    attempts: number,
    nextAttemptAt: Date,
    error: string,
  ): Promise<void> {
    await this.em.getConnection().execute(
      `UPDATE outbox_events SET attempts = ?, next_attempt_at = ?, last_error = ? WHERE id = ?`,
      [attempts, nextAttemptAt, error.slice(0, 4000), id],
    );
  }

  /** Moves a permanently failed event to the service-owned dead-letter table. */
  public async moveToDeadLetter(id: string, error: string): Promise<void> {
    await this.em.transactional(async (tx) => {
      await tx.getConnection().execute(
        `
        INSERT INTO outbox_dead_letters
          (id, event_type, event_version, payload, producer, correlation_id, causation_id, attempts, error, created_at)
        SELECT id, type, version, payload, producer, correlation_id, causation_id, attempts, ?, now()
        FROM outbox_events
        WHERE id = ?
        ON CONFLICT (id) DO UPDATE SET error = EXCLUDED.error, attempts = EXCLUDED.attempts
        `,
        [error.slice(0, 4000), id],
      );
      await tx.getConnection().execute(`DELETE FROM outbox_events WHERE id = ?`, [id]);
    });
  }
}

/** Raw PostgreSQL row shape used only by the persistence adapter. */
interface RawOutboxRow {
  id: string;
  type: string;
  version: string;
  payload: unknown;
  producer: string;
  correlation_id: string;
  causation_id: string | null;
  attempts: number;
  published_at: Date | null;
  last_error: string | null;
  next_attempt_at: Date | null;
  created_at: Date;
}

/** Maps a PostgreSQL row into the transport-neutral outbox contract. */
function toRecord(row: RawOutboxRow): OutboxRecord {
  return {
    id: row.id,
    type: row.type,
    version: row.version,
    payload: row.payload,
    producer: row.producer,
    correlationId: row.correlation_id,
    causationId: row.causation_id ?? undefined,
    attempts: row.attempts,
    publishedAt: row.published_at ?? undefined,
    lastError: row.last_error ?? undefined,
    nextAttemptAt: row.next_attempt_at ?? undefined,
    createdAt: row.created_at,
  };
}
