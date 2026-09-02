/**
 * @file service.constant.ts
 * @description Canonical immutable metadata for the iam service.
 *
 * Consumed by health, telemetry, logging, metrics, OpenAPI, diagnostics, and
 * infrastructure composition. Keep synchronized with package.json.
 */
/** Canonical package name. */
export const SERVICE_PACKAGE_NAME = "@figentra/iam";
/** Stable service slug. */
export const SERVICE_NAME = "iam";
/** Service release version. */
export const SERVICE_VERSION = "0.0.1";
/** Immutable service identity object. */
export const SERVICE_IDENTITY = Object.freeze({
  name: SERVICE_NAME,
  packageName: SERVICE_PACKAGE_NAME,
  version: SERVICE_VERSION,
} as const);
