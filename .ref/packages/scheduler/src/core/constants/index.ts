/**
 * @file index.ts
 * @module @stackra/scheduler/core/constants
 * @description Package-owned constants.
 *
 *   NOTE: `SCHEDULER_CONFIG` used to live here as
 *   `SCHEDULER_CONFIG_INTERNAL` (a package-private symbol). Post
 *   ADR-0063 amendment, the config is bound under the workspace-
 *   canonical `SCHEDULER_CONFIG` string constant from
 *   `@stackra/contracts` — cross-package consumers can `@Inject` the
 *   same identity. Cross-package tokens (`SCHEDULER_SERVICE`,
 *   `TASK_RUNNER`, `SCHEDULED_METADATA_KEY`) also live in
 *   `@stackra/contracts`.
 */

export {};
