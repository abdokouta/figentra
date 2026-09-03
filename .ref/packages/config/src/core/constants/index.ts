/**
 * @file index.ts
 * @module @stackra/config/core/constants
 * @description Barrel export for config constants.
 *   DI tokens and event constants are in @stackra/contracts — import from there.
 */

/** Default config module options. */
export const DEFAULT_CONFIG_OPTIONS = {};

/** All supported config drivers. */
export const SUPPORTED_DRIVERS = ['file', 'env', 'memory', 'http'] as const;

/** Synchronous config drivers. */
export const SYNC_DRIVERS = ['file', 'env', 'memory'] as const;

/** Asynchronous config drivers. */
export const ASYNC_DRIVERS = ['http'] as const;
