/**
 * @file deprecation-signal.interface.ts
 * @module @stackra/contracts/interfaces/versioning
 * @description Deprecation signal + event-payload shapes emitted by
 *   `@stackra/versioning` when a response advertises the backend's
 *   deprecation headers (`Deprecation`, `Sunset`, `Link:
 *   successor-version`, `X-API-Deprecation-Message`,
 *   `X-API-Replaced-By`).
 *
 *   Every payload composes on top of `IDeprecationSignal` so
 *   subscribers on the shared event bus can read a stable shape
 *   regardless of the specific event they subscribed to.
 */

/**
 * Structured deprecation signal derived from a response's headers.
 *
 * Mirrors the backend `stackra/versioning` wrapper's response-header
 * table (RFC 8594 + draft-ietf-httpapi-deprecation-header).
 */
export interface IDeprecationSignal {
  /**
   * Human-readable deprecation reason — from `X-API-Deprecation-Message`
   * OR a synthetic fallback when only `Deprecation: true` is set.
   */
  readonly message: string;

  /**
   * ISO-8601 sunset timestamp — from `Sunset` header. Absent when the
   * backend didn't set the sunset date.
   */
  readonly sunsetDate?: string;

  /**
   * Successor version identifier — from `X-API-Replaced-By` OR the
   * `Link: rel="successor-version"` header's target.
   */
  readonly replacedBy?: string;

  /**
   * Documentation URL — from the `X-API-Documentation` header OR the
   * backend's `application/problem+json` `documentation` field.
   */
  readonly documentation?: string;
}

/**
 * Payload for `VERSIONING_EVENTS.DEPRECATED_HIT`.
 */
export interface IDeprecatedHitPayload {
  /** The HTTP connection name that made the call (e.g. `"api"`). */
  readonly connection: string;

  /** The endpoint URL that received the deprecation signal. */
  readonly endpoint: string;

  /** The resolved `X-API-Version` on the response (server-side). */
  readonly currentVersion?: string;

  /** The full deprecation signal parsed from response headers. */
  readonly signal: IDeprecationSignal;

  /** Wall-clock timestamp when the signal was observed (millis). */
  readonly observedAt: number;
}

/**
 * Payload for `VERSIONING_EVENTS.SUNSET_APPROACHING`.
 */
export interface ISunsetApproachingPayload extends IDeprecatedHitPayload {
  /** How many days until the sunset date (integer, rounded down). */
  readonly daysUntilSunset: number;
}

/**
 * Payload for `VERSIONING_EVENTS.VERSION_REJECTED`. Mirrors the
 * backend's RFC 7807 `application/problem+json` response shape.
 */
export interface IVersionRejectedPayload {
  /** The HTTP connection name that made the call. */
  readonly connection: string;

  /** The endpoint URL that returned the 400. */
  readonly endpoint: string;

  /** The version the frontend requested that the server rejected. */
  readonly requestedVersion: string;

  /** Every version the endpoint supports (server-provided). */
  readonly supportedVersions: readonly string[];

  /** Human-readable detail from `application/problem+json.detail`. */
  readonly detail: string;
}
