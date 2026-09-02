/**
 * @file brand-module-options.interface.ts
 * @module @stackra/contracts/interfaces/brand
 * @description Configuration options accepted by `BrandModule.forRoot`.
 *
 *   Boot-time shape. Consumers reach it through the `BRAND_CONFIG`
 *   token — the token binds the shape, the shape lives with its
 *   owning package. Matches the pattern used by every other
 *   `@stackra/*` module.
 */

import type { IBrandMetadata } from "./brand-metadata.interface";

/**
 * Configuration for the brand module.
 */
export interface IBrandModuleOptions {
  /**
   * The brand identity to apply at boot. Written to `<head>` by
   * `BrandService.applyDocumentMetadata()` during `onModuleInit`.
   * Later runtime overrides (tenant branding, admin edits) flow
   * through `BrandService.applyPayload(payload)` and override
   * these values.
   */
  readonly metadata: IBrandMetadata;

  /**
   * Whether to emit brand-state-change events through
   * `@stackra/events`. When true, subscribers of
   * `BRAND_EVENTS.IDENTITY_APPLIED` fire on each apply.
   *
   * @default true
   */
  readonly emitEvents?: boolean;

  /**
   * Page title formatter — computes `document.title` from the
   * brand + optional route context. Defaults to
   * `"{name}" + (tagline ? " — {tagline}" : "")`.
   *
   * Consumers wanting `"Dashboard · Academorix"` shape override
   * this. The `route` argument is the current pathname; consumers
   * can ignore it for brand-only titles.
   */
  readonly formatPageTitle?: (params: {
    readonly name: string;
    readonly tagline?: string;
    readonly route?: string;
  }) => string;
}
