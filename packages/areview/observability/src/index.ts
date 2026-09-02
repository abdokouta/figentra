/**
 * @file index.ts
 * @description Root exports for the Figentra observability platform package.
 *
 * Prefer subpath imports in applications so framework-specific dependencies
 * remain explicit and tree-shakeable.
 */
export type { LogEntry, ServiceIdentity, TelemetryContext } from "./contracts/index";
/** Public barrel export. */
export { createTelemetryContext, SENSITIVE_LOG_FIELDS } from "./core/index";
