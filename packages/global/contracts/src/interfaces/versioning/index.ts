/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/versioning
 * @description Barrel for the versioning subsystem contracts.
 *   Cross-package consumers (interceptors, React hooks, dashboards,
 *   monitoring reporters) import from here.
 */

export type {
  IDeprecatedHitPayload,
  IDeprecationSignal,
  ISunsetApproachingPayload,
  IVersionRejectedPayload,
} from "./deprecation-signal.interface";
export type {
  IConnectionVersioningOptions,
  IDeprecationLogOptions,
  IVersioningModuleOptions,
} from "./versioning-module-options.interface";
export type { IVersioningService } from "./versioning-service.interface";
export {
  DEFAULT_VERSIONING_STRATEGY,
  type VersioningStrategy,
} from "./versioning-strategy.type";
