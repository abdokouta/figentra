/**
 * @file index.ts
 * @description Transactional outbox primitives for Figentra services.
 *
 * The outbox guarantees that a domain mutation and its corresponding event
 * record are committed in the same database transaction. A separate relay
 * publishes committed rows to NATS. Publishing is therefore at-least-once;
 * consumers MUST be idempotent.
 */
import { EntityManager, EntitySchema } from "@mikro-orm/core";
import { z } from "zod";

/**
 * Canonical event row persisted in the service-owned outbox table.
 */
export interface OutboxRecord {
  /** Stable outbox id. */
  readonly id: string;
  /** Canonical event type. */
  readonly type: string;
  /** Semantic event version. */
  readonly version: string;
  /** Serialized event payload. */
  readonly payload: unknown;
  /** Producer service identifier. */
  readonly producer: string;
  /** Correlation identifier. */
  readonly correlationId: string;
  /** Optional causation identifier. */
  readonly causationId?: string;
  /** Number of delivery attempts. */
  readonly attempts: number;
  /** Publication timestamp when successful. */
  readonly publishedAt?: Date;
  /** Last delivery failure. */
  readonly lastError?: string;
  /** Next retry timestamp. */
  readonly nextAttemptAt?: Date;
  /** Creation timestamp. */
  readonly createdAt: Date;
}

/**
 * Runtime validation schema for a publishable outbox event.
 */
export const outboxEventSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  version: z.string().min(1),
  producer: z.string().min(1),
  correlationId: z.string().min(1),
  causationId: z.string().optional(),
  payload: z.unknown(),
});

/**
 * MikroORM entity schema used by service-owned outbox tables.
 *
 * Each service should map this schema to its own database/schema and never
 * share an outbox table across service boundaries.
 */
export const OutboxEntity = new EntitySchema<OutboxRecord>({
  name: "OutboxRecord",
  tableName: "outbox_events",
  properties: {
    id: { primary: true, type: "string", length: 64 },
    type: { type: "string", length: 255 },
    version: { type: "string", length: 32 },
    payload: { type: "json" },
    producer: { type: "string", length: 128 },
    correlationId: { fieldName: "correlation_id", type: "string", length: 128 },
    causationId: { fieldName: "causation_id", type: "string", length: 128, nullable: true },
    attempts: { type: "number", default: 0 },
    publishedAt: { fieldName: "published_at", type: Date, nullable: true },
    lastError: { fieldName: "last_error", type: "string", nullable: true },
    nextAttemptAt: { fieldName: "next_attempt_at", type: Date, nullable: true },
    createdAt: { fieldName: "created_at", type: Date },
  },
});

/**
 * Writes an outbox row inside the caller's current MikroORM transaction.
 *
 * @param em - Transaction-scoped EntityManager.
 * @param event - Validated event to persist.
 */
export async function appendOutboxEvent(
  em: EntityManager,
  event: OutboxRecord,
): Promise<void> {
  outboxEventSchema.parse(event);
  em.persist(em.create(OutboxEntity, event));
}

/**
 * Computes an exponential retry delay with a bounded maximum.
 *
 * @param attempts - Attempt number starting at one.
 * @param baseMs - Initial delay.
 * @param maxMs - Maximum delay.
 * @returns Delay in milliseconds.
 */
export function retryDelay(attempts: number, baseMs = 500, maxMs = 300_000): number {
  const exponent = Math.max(0, attempts - 1);
  return Math.min(maxMs, baseMs * 2 ** exponent);
}

/** Public barrel export. */
export { MikroOrmOutboxStore } from "./mikro-orm.js";
