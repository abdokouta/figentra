/**
 * @file index.ts
 * @module @stackra/queue/core/constants
 * @description Barrel export for queue constants.
 */

// ════════════════════════════════════════════════════════════════════════════════
// DI Tokens
// ════════════════════════════════════════════════════════════════════════════════

/** DI token for the QueueManager instance. */
export const QUEUE_MANAGER = Symbol.for('QUEUE_MANAGER');

/** DI token for the queue module configuration. */
export const QUEUE_CONFIG = Symbol.for('QUEUE_CONFIG');

// ════════════════════════════════════════════════════════════════════════════════
// Metadata Keys
// ════════════════════════════════════════════════════════════════════════════════

/** Metadata key for @Processor class decorator. */
export const PROCESSOR_METADATA = 'stackra:queue:processor';

/** Metadata key for @OnJobEvent method decorator. */
export const ON_JOB_EVENT_METADATA = 'stackra:queue:on-job-event';

// ════════════════════════════════════════════════════════════════════════════════
// Queue Events
// ════════════════════════════════════════════════════════════════════════════════

/** Queue lifecycle event names emitted via the EventEmitter. */
export const QUEUE_EVENTS = {
  /** A job was dispatched to a queue. */
  JOB_DISPATCHED: 'queue.job.dispatched',
  /** A job started processing. */
  JOB_STARTED: 'queue.job.started',
  /** A job completed successfully. */
  JOB_COMPLETED: 'queue.job.completed',
  /** A job failed (may retry). */
  JOB_FAILED: 'queue.job.failed',
  /** A job exceeded max attempts and moved to DLQ. */
  JOB_DEAD: 'queue.job.dead',
} as const;
