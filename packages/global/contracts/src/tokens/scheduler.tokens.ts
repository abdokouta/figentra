/**
 * @file scheduler.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens and metadata keys for the scheduler subsystem.
 *
 *   Tokens live in contracts so cross-package consumers (discovery
 *   loaders, dashboards) can reference them without pulling in the
 *   runtime.
 */

/** Token for the SchedulerService singleton. */
export const SCHEDULER_SERVICE = Symbol.for("SCHEDULER_SERVICE");

/**
 * Configuration namespace for the scheduler subsystem.
 *
 * String constant used both as the `registerAs(SCHEDULER_CONFIG, ...)`
 * namespace on the app-side config factory AND as the DI token that
 * `SchedulerModule` binds the resolved config under. The value IS the
 * namespace string — consumers can spell either the constant or the
 * literal `"scheduler"` and reach the same registration.
 */
export const SCHEDULER_CONFIG = "scheduler" as const;

/** Token for the platform-specific ITaskRunner implementation. */
export const TASK_RUNNER = Symbol.for("TASK_RUNNER");

/** Metadata key for the `@Scheduled()` decorator. */
export const SCHEDULED_METADATA_KEY = "stackra:scheduler:scheduled";
