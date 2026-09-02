/**
 * @file environment.mixin.ts
 * @module @stackra/container/mixins
 * @description Environment Mixin
 *
 *   Adds environment detection helpers to any class. Applied to
 *   `ApplicationContext` so consumers can check `app.isProduction`,
 *   `app.isDevelopment`, etc. without importing `Env` directly.
 *
 *   Uses the mixin pattern — a function that takes a base class and
 *   returns an extended class with the environment methods.
 */

/**
 * Read an environment variable. Delegates to `Env.get()` from
 * `@stackra/support` which handles the Node/Vite/window `__ENV__`
 * triple-substrate lookup.
 *
 * Kept as a named export so downstream code that imports `env` from this
 * mixin file (rather than importing `Env` from `@stackra/support` directly)
 * keeps working. New consumers should import `Env` from `@stackra/support`.
 *
 * @deprecated Use `Env.get(key, fallback)` from `@stackra/support` directly.
 *   Signature preserved for backward compatibility.
 */
export function env<T = string>(key: string, fallback?: T): T | undefined {
  const value = Env.get(key, "");
  if (value === "" || value === undefined || value === null) return fallback;
  return value as unknown as T;
}

/**
 * Constructor-shape utility used by the mixin factory below.
 *
 * `any[]` on the rest parameter is required by TS2545 — the mixin-class
 * check needs `any` there to forward `super(...args)` regardless of the
 * base's real signature.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T = object> = new (...args: any[]) => T;

import { Env, Str } from "@stackra/support";

import type { IEnvironmentAware } from "../interfaces/environment-aware.interface";

export type { IEnvironmentAware };

/**
 * Environment mixin — adds environment detection to any class.
 *
 * @param Base - The base class to extend
 * @returns A new class with environment helpers
 *
 * @example
 * ```typescript
 * class MyApp extends WithEnvironment(BaseClass) {
 *   boot() {
 *     if (this.isDevelopment) {
 *       logger.info("Dev mode — extra logging enabled");
 *     }
 *   }
 * }
 * ```
 */
export function WithEnvironment<TBase extends Constructor>(Base: TBase) {
  return class EnvironmentMixin extends Base implements IEnvironmentAware {
    /**
     * Current environment name.
     *
     * Reads from `APP_ENV` or `NODE_ENV`. Defaults to `"production"`.
     *
     * @example
     * ```typescript
     * app.environment; // "development"
     * ```
     */
    public get environment(): string {
      // Route the case-fold through `Str.lower` per
      // `.kiro/steering/support-utilities.md` instead of a bare
      // `.toLowerCase()`.
      return Str.lower(env("APP_ENV") ?? env("NODE_ENV") ?? "production");
    }

    /**
     * Whether the app is running in production.
     *
     * @example
     * ```typescript
     * if (app.isProduction) {
     *   // disable debug logging, enable caching
     * }
     * ```
     */
    public get isProduction(): boolean {
      return this.environment === "production";
    }

    /**
     * Whether the app is running in development or local.
     *
     * @example
     * ```typescript
     * if (app.isDevelopment) {
     *   // enable hot reload, verbose errors
     * }
     * ```
     */
    public get isDevelopment(): boolean {
      const env = this.environment;
      return env === "development" || env === "local" || env === "dev";
    }

    /**
     * Whether the app is running in a testing environment.
     *
     * @example
     * ```typescript
     * if (app.isTesting) {
     *   // use mock services, disable network calls
     * }
     * ```
     */
    public get isTesting(): boolean {
      const env = this.environment;
      return env === "testing" || env === "test";
    }

    /**
     * Whether the app is running in staging.
     *
     * @example
     * ```typescript
     * if (app.isStaging) {
     *   // enable feature flags for QA
     * }
     * ```
     */
    public get isStaging(): boolean {
      return this.environment === "staging";
    }

    /**
     * Whether debug mode is enabled.
     *
     * Reads from `DEBUG` env var. Also true in development.
     */
    public get isDebug(): boolean {
      return env<boolean>("DEBUG", false) || this.isDevelopment;
    }

    /**
     * Check if the current environment matches a given name.
     *
     * Case-insensitive comparison.
     *
     * @param name - Environment name to check
     * @returns `true` if the current environment matches
     *
     * @example
     * ```typescript
     * app.isEnvironment("staging"); // true/false
     * ```
     */
    public isEnvironment(name: string): boolean {
      // Route the case-fold through `Str.lower` per
      // `.kiro/steering/support-utilities.md` instead of a bare
      // `.toLowerCase()`.
      return this.environment === Str.lower(name);
    }
  };
}
