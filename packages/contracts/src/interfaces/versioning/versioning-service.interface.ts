/**
 */

import type {
  IDeprecatedHitPayload,
  IDeprecationSignal,
} from "./deprecation-signal.interface";

/**
 * The versioning service — resolves the version per (connection,
 * per-request override) pair, records deprecation hits, and
 * exposes them to reactive consumers.
 */
export interface IVersioningService {
  /**
   * Resolve the effective version for a given connection. Precedence:
   *
   *   1. Per-request `apiVersion` (read by the interceptor from
   *      `IHttpRequestConfig.meta.apiVersion` — this method is
   *      NOT called on that path).
   *   2. Per-connection `connections[<name>].default`.
   *   3. Module-level `default`.
   *
   * @param connection - The HTTP connection name (e.g. `"api"`).
   * @returns The version string OR `null` when the connection is
   *   configured with `apiVersion: false` (opt-out).
   */
  versionFor(connection: string): string | null;

  /**
   * Get every deprecated-endpoint hit recorded this session. The
   * returned array is a stable snapshot — subscribers use
   * {@link subscribe} to observe changes.
   */
  getDeprecatedHits(): readonly IDeprecatedHitPayload[];

  /**
   * Check whether a specific endpoint has been marked deprecated this
   * session. Useful for banners that decide whether to warn the user.
   */
  isDeprecated(endpoint: string): boolean;

  /**
   * Read the deprecation signal for a specific endpoint if one has
   * been recorded, or `undefined` otherwise.
   */
  signalFor(endpoint: string): IDeprecationSignal | undefined;

  /**
   * Subscribe to changes in the deprecated-hits log. React consumers
   * use `useSyncExternalStore(service.subscribe, service.getDeprecatedHits)`
   * — hooks into React's tearing-safe subscription contract.
   *
   * @param listener - Fired every time a new hit is recorded.
   * @returns Unsubscribe function.
   */
  subscribe(listener: () => void): () => void;

  /**
   */
  reset(): void;
}
