/**
 * @file versioning.events.ts
 * @module @stackra/contracts/events
 * @description Event names emitted by `@stackra/versioning` on the
 *   `EVENT_EMITTER` bus.
 *
 *   Mirrors the backend `stackra/versioning` wrapper's response-
 *   header vocabulary (`Deprecation`, `Sunset`, `Link:
 *   successor-version`, `X-API-Version`).
 */

/**
 * Emitted every time an HTTP response advertises a deprecation
 * signal (`Deprecation: true` OR `X-API-Deprecated: true`).
 * Payload: `IDeprecatedHitPayload`.
 */
export const VERSIONING_DEPRECATED_HIT = "versioning.deprecated.hit";

/**
 * Emitted when a deprecated endpoint's `Sunset` date falls within
 * the configured warning window (default 30 days).
 * Payload: `ISunsetApproachingPayload`.
 */
export const VERSIONING_SUNSET_APPROACHING = "versioning.sunset.approaching";

/**
 * Emitted when the server rejects the requested version with
 * `application/problem+json` (RFC 7807). Payload:
 * `IVersionRejectedPayload`.
 */
export const VERSIONING_VERSION_REJECTED = "versioning.version.rejected";

/**
 * API-versioning lifecycle event names.
 */
export const VERSIONING_EVENTS = {
  /** A deprecated endpoint was hit this session. */
  DEPRECATED_HIT: VERSIONING_DEPRECATED_HIT,
  /** A sunset date falls within the configured warning window. */
  SUNSET_APPROACHING: VERSIONING_SUNSET_APPROACHING,
  /** The server rejected the requested version (RFC 7807). */
  VERSION_REJECTED: VERSIONING_VERSION_REJECTED,
} as const;

/** Union type of every emitted versioning event name. */
export type VersioningEventName =
  (typeof VERSIONING_EVENTS)[keyof typeof VERSIONING_EVENTS];
