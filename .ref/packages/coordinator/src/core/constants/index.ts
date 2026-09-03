/**
 * @file index.ts
 * @module @stackra/coordinator/core/constants
 * @description Package-owned constants.
 *
 *   NOTE: `COORDINATOR_CONFIG` used to live here as
 *   `COORDINATOR_CONFIG_INTERNAL` (a package-private symbol). Post
 *   ADR-0063 amendment, the config is bound under the workspace-
 *   canonical `COORDINATOR_CONFIG` string constant from
 *   `@stackra/contracts` — cross-package consumers can `@Inject` the
 *   same identity. Cross-package tokens (`TAB_COORDINATOR`,
 *   `TAB_LOCK_MANAGER`, `TAB_TRANSPORT_MANAGER`,
 *   `COORDINATOR_EVENTS`) also live in `@stackra/contracts`.
 */

export {};
