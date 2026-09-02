/**
 * @file brand-service.interface.ts
 * @module @stackra/contracts/interfaces/brand
 * @description Public verb surface of the brand runtime — the
 *   contract bound behind `BRAND_SERVICE` in the container.
 *
 *   Cross-package consumers (`TenantBrandBridge` in `@stackra/tenancy`,
 *   auth-ui login screen preview, admin brand-editor preview,
 *   marketing landing) type against this interface rather than the
 *   concrete `BrandService` class. Keeps the contracts-tier
 *   dependency graph clean per
 *   `.kiro/steering/contracts-and-decorators-promotion.md`.
 *
 *   Implemented by `BrandService` in `@stackra/brand`.
 */

import type { IBrandMetadata } from "./brand-metadata.interface";
import type { IBrandPayload } from "./brand-payload.interface";

/**
 * Central orchestrator for the brand runtime.
 */
export interface IBrandService {
  /**
   * Write the current metadata to the platform's head-equivalent —
   * `<title>`, `<meta description>`, favicon, OG / Twitter tags,
   * JSON-LD Organization. Called at boot before React mounts, and
   * again on every `applyPayload` call so runtime overrides
   * propagate.
   */
  applyDocumentMetadata(): void;

  /**
   * Fold a wire-shaped `IBrandPayload` on top of the boot-time
   * default metadata and re-apply to the platform. Idempotent —
   * a second call with the same payload writes the same tags.
   *
   * Called by `TenantBrandBridge` on tenant resolve, and by the
   * brand-editor preview when an admin drafts a change.
   *
   * @param payload - The wire-shaped brand override.
   */
  applyPayload(payload: IBrandPayload): void;

  /**
   * Read the current effective metadata (base + runtime override).
   * Consumers use this via `useBrand()` on the React side.
   */
  getMetadata(): IBrandMetadata;
}
