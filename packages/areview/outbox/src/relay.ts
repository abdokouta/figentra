/**
 * @file relay.ts
 * @description At-least-once transactional-outbox relay with bounded retries.
 *
 * The relay deliberately treats publication as at-least-once. A successful
 * NATS publish followed by a process crash can cause a duplicate when the row
 * is retried. Every event therefore carries a stable id and consumers must
 * enforce idempotency on that id.
 */
import { jetstream } from "@nats-io/jetstream";
import type { NatsConnection } from "@nats-io/nats-core";
import { retryDelay, type OutboxRecord } from "./index.js";

/**
 * Minimal persistence contract required by the relay.
 */
export interface OutboxRelayStore {
  /** Claims a bounded batch for exclusive relay processing. */
  claim(limit: number): Promise<readonly OutboxRecord[]>;
  /** Marks a record as successfully published. */
  markPublished(id: string, publishedAt: Date): Promise<void>;
  /** Records a retryable failure. */
  markFailed(id: string, attempts: number, nextAttemptAt: Date, error: string): Promise<void>;
  /** Moves a permanently failed event to the service-owned dead-letter table. */
  moveToDeadLetter(id: string, error: string): Promise<void>;
}

/**
 * Relay options.
 */
export interface OutboxRelayOptions {
  /** NATS JetStream client. */
  readonly connection: NatsConnection;
  /** Subject prefix for platform events. */
  readonly subjectPrefix: string;
  /** Maximum attempts before dead-lettering. */
  readonly maxAttempts?: number;
  /** Maximum records processed in one poll. */
  readonly batchSize?: number;
}

/**
 * Publishes committed outbox rows to NATS JetStream.
 */
export class OutboxRelay {
  /** Creates a relay. */
  public constructor(
    private readonly store: OutboxRelayStore,
    private readonly options: OutboxRelayOptions,
  ) {}

  /**
   * Runs one bounded relay pass.
   * @returns Number of records successfully published.
   */
  public async runOnce(): Promise<number> {
    const records = await this.store.claim(this.options.batchSize ?? 100);
    let published = 0;
    const js = jetstream(this.options.connection);

    for (const record of records) {
      try {
        await js.publish(`${this.options.subjectPrefix}.${record.type}.v${record.version}`, {
          id: record.id,
          type: record.type,
          version: record.version,
          producer: record.producer,
          correlationId: record.correlationId,
          causationId: record.causationId,
          payload: record.payload,
        });
        await this.store.markPublished(record.id, new Date());
        published += 1;
      } catch (error) {
        const attempts = record.attempts + 1;
        const message = error instanceof Error ? error.message : String(error);
        if (attempts >= (this.options.maxAttempts ?? 10)) {
          await this.store.moveToDeadLetter(record.id, message);
          continue;
        }
        await this.store.markFailed(
          record.id,
          attempts,
          new Date(Date.now() + retryDelay(attempts)),
          message,
        );
      }
    }

    return published;
  }
}
