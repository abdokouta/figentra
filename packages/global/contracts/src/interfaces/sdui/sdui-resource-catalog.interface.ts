/**
 * @file sdui-resource-catalog.interface.ts
 * @module @stackra/contracts/interfaces/sdui
 * @description Wire-visible envelope shape returned by the backend's
 *   `GET /api/v1/platform/schema` endpoint. Consumed by the frontend
 *   `useResourceCatalog()` hook + downstream sidebar renderer.
 */

import type { ISduiResource } from "./sdui-resource.interface";

/**
 * Wire envelope — Spatie Data's outer `{ data: { ... } }` wrapper is
 * unwrapped by the frontend HTTP client, so consumers see the flat
 * inner shape only.
 */
export interface ISduiResourceCatalog {
  /** Caller-filtered list of admin resources (permission-gated + sorted). */
  readonly resources: readonly ISduiResource[];
}

/**
 * Transport-layer client that fetches the resource catalogue from the
 * backend. Implemented by `HttpResourceCatalogClient` (production) or
 * a fake in test suites.
 */
export interface ISduiResourceCatalogClient {
  /**
   * Fetch the catalogue from `GET /api/v1/platform/schema`. May throw
   * on network / auth failure — consumers handle via error boundary.
   */
  fetchCatalog(): Promise<ISduiResourceCatalog>;
}
