/**
 * @file logger.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the logger system.
 */

/**
 * Configuration namespace for the logger subsystem.
 *
 * String constant used both as the `registerAs(LOGGER_CONFIG, ...)`
 * namespace on the app-side config factory AND as the DI token that
 * `LoggerModule` binds the resolved config under. The value IS the
 * namespace string — consumers can spell either the constant or the
 * literal `"logger"` and reach the same registration.
 */
export const LOGGER_CONFIG = "logger" as const;

/** Token for the LoggerManager instance. */
export const LOGGER_MANAGER = Symbol.for("LOGGER_MANAGER");

/**
 * Metadata key stamped by the `@Reporter('name')` class decorator.
 * The `LoggerManager` reads it at bootstrap via
 * `discovery.getProvidersByMetadata(LOGGER_REPORTER_METADATA_KEY)`
 * and registers each discovered instance by name.
 *
 * String key (not `Symbol.for(...)`) for cross-realm stability + the
 * repo-wide `stackra:<domain>:<name>` convention.
 */
export const LOGGER_REPORTER_METADATA_KEY = "stackra:logger:reporter";
