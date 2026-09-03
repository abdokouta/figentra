/**
 * @file tokens.constant.ts
 * @module @stackra/nestjs-health/constants
 * @description Internal DI tokens for the health module.
 *
 * These tokens are used internally within the package for provider injection.
 * They are NOT promoted to @stackra/contracts because no external package
 * needs to inject them directly — consumers interact via the module API.
 *
 * Public tokens (HEALTH_INDICATOR_METADATA_KEY) live in @stackra/contracts.
 */

/** DI token for the merged health module configuration. */
export const HEALTH_MODULE_OPTIONS = Symbol.for('HEALTH_MODULE_OPTIONS');

/** DI token for the active result store implementation. */
export const HEALTH_RESULT_STORE = Symbol.for('HEALTH_RESULT_STORE');

/** DI token for the optional health metrics interface. */
export const HEALTH_METRICS = Symbol.for('HEALTH_METRICS');
