/**
 * @file env-driver-options.interface.ts
 * @module @stackra/config/src/interfaces
 * @description IEnvDriverOptions interface.
 */

/**
 * Options for the EnvDriver.
 */
export interface IEnvDriverOptions {
  /** Whether to resolve `${VAR}` references in values. */
  expandVariables?: boolean;

  /** Prefix to strip from keys, 'auto' to auto-detect, or false to disable. */
  envPrefix?: string | false;

  /** Browser global variable name to read config from. */
  globalName?: string;
}
