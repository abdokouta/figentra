/**
 * @file queue.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens and metadata keys for the queue subsystem.
 *
 *   Tokens live in contracts so cross-package consumers (processor
 *   loaders, dashboards, workers) can reference them without pulling
 *   in the runtime.
 */

/**
 * Configuration namespace for the queue subsystem.
 *
 * String constant used both as the `registerAs(QUEUE_CONFIG, ...)`
 * namespace on the app-side config factory AND as the DI token that
 * `QueueModule` binds the resolved config under. The value IS the
 * namespace string — consumers can spell either the constant or the
 * literal `"queue"` and reach the same registration.
 */
export const QUEUE_CONFIG = "queue" as const;

/** Token for the QueueManager singleton. */
export const QUEUE_MANAGER = Symbol.for("QUEUE_MANAGER");

/** Metadata key for the `@Processor()` decorator. */
export const PROCESSOR_METADATA_KEY = "stackra:queue:processor";

/** Metadata key for the `@OnJobEvent()` decorator. */
export const ON_JOB_EVENT_METADATA_KEY = "stackra:queue:on-job-event";
