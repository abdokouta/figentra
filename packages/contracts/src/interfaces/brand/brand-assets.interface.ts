/**
 * @file brand-assets.interface.ts
 * @module @stackra/contracts/interfaces/brand
 * @description The set of image assets a brand ships.
 *
 *   Four canonical roles, each optional so a brand can ship as
 *   little or as much as it wants. `<BrandLogo>` / `<BrandMark>`
 *   fall back through the roles when a specific slot isn't set —
 *   `<BrandLogo>` prefers `logotipo` and falls back to `isotipo`;
 *   `<BrandMark>` prefers `isotipo` and falls back to `logotipo`.
 */

import type { IBrandAsset } from "./brand-asset.interface";

/**
 * The brand's image assets.
 */
export interface IBrandAssets {
  /**
   * Full wordmark — the brand's name + mark rendered as one image.
   * Used in expanded sidebars, full headers, and brand bars.
   * Mirrors HeroUI Builder's `logotipo` role.
   */
  readonly logotipo?: IBrandAsset;

  /**
   * Compact symbol-only mark. Used in collapsed sidebars, mobile
   * headers, avatars, app icons. Mirrors HeroUI Builder's
   * `isotipo` role.
   */
  readonly isotipo?: IBrandAsset;

  /**
   * Favicon URL. Written to `<link rel="icon">` on `<head>` by
   * `BrandService.applyDocumentMetadata()` at boot.
   */
  readonly favicon?: string;

  /**
   * Open Graph preview image URL. Written to `<meta
   * property="og:image">` on `<head>`. Ideally 1200×630px per
   * OG spec.
   */
  readonly ogImage?: string;
}
