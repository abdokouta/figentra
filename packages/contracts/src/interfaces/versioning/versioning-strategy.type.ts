/**
 * @file versioning-strategy.type.ts
 * @module @stackra/contracts/interfaces/versioning
 * @description Version-advertisement strategies the frontend HTTP
 *   client uses to signal a version to the backend.
 *
 *   Values match the backend `stackra/versioning` wrapper's detection
 *   order (per its README §"Detection strategies"):
 *
 *     - `header`      → stamps `X-API-Version: 2.0` (customisable name).
 *     - `query`       → appends `?api-version=2.0` to the URL.
 *     - `path`        → rewrites the URL to `/api/v2.0/...`.
 *     - `media-type`  → sets `Accept: application/vnd.stackra+json;version=2.0`.
 *
 *   The backend consults strategies in the order defined in its own
 *   config; the frontend picks ONE strategy per configuration surface.
 */

/**
 * The four supported strategies for advertising the API version.
 * String union — no `enum` per `.kiro/steering/frontend-packages.md` §3.
 */
export type VersioningStrategy = "header" | "query" | "path" | "media-type";

/**
 * The default strategy — matches the backend's default detection
 * order (header first).
 */
export const DEFAULT_VERSIONING_STRATEGY: VersioningStrategy = "header";
