/**
 * @file scope.enum.ts
 * @module @stackra/contracts/primitives
 * @description Provider scope enum. Controls whether a provider is
 *   instantiated once (singleton), once per request, or once per
 *   transient injection.
 */

/**
 * DI provider scope.
 *
 * - `DEFAULT` — singleton (one instance for the lifetime of the app).
 * - `REQUEST` — one instance per incoming request (per-request EM, etc.).
 * - `TRANSIENT` — a fresh instance on every injection.
 */
export enum Scope {
  /** Singleton — shared across the entire application. */
  DEFAULT = 0,
  /** Request-scoped — one instance per HTTP request / queue message. */
  REQUEST = 1,
  /** Transient — a new instance on every injection site. */
  TRANSIENT = 2,
}
