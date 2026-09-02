/**
 * @file brand-metadata.interface.ts
 * @module @stackra/contracts/interfaces/brand
 * @description The full identity payload every brand ships.
 *
 *   Consumed by `BrandService.applyDocumentMetadata()` to write
 *   `<title>`, `<link rel="icon">`, `<meta name="description">`,
 *   `<meta property="og:*">`, `<meta name="twitter:*">`, and the
 *   JSON-LD `Organization` block. Also read by `<BrandLogo>` /
 *   `<BrandMark>` / `useBrand()` for asset URLs.
 *
 *   Distinct from `IThemeValues` (which owns visual tokens) — brand
 *   is what HeroUI's CSS variables CAN'T express: name, tagline,
 *   description, logo asset URLs, favicon, OG tags, JSON-LD.
 */

import type { IBrandAssets } from "./brand-assets.interface";

/**
 * A brand's complete identity metadata.
 */
export interface IBrandMetadata {
  /**
   * Legal + display name. Written as `<title>` (subject to
   * formatting), the OG `og:site_name`, and the JSON-LD
   * Organization `name`. Never empty.
   */
  readonly name: string;

  /**
   * Short-form name for compact contexts (mobile home screen icon
   * label, PWA manifest `short_name`, app menu bar). Falls back to
   * `name` when omitted.
   */
  readonly shortName?: string;

  /**
   * Tagline. Optional descriptor rendered next to or beneath the
   * name in the browser tab title (`<name> — <tagline>`), in the
   * splash screen, or under the logo in the login page. Not
   * shown to search engines.
   */
  readonly tagline?: string;

  /**
   * Long-form description. Written as `<meta name="description">`,
   * OG `og:description`, Twitter `twitter:description`, and the
   * JSON-LD `Organization.description`. Search-engine visible.
   */
  readonly description: string;

  /**
   * Canonical URL for this brand's homepage. Written as OG
   * `og:url` and JSON-LD `Organization.url`. Consumers running
   * behind a multi-tenant subdomain scheme should set this to the
   * brand's public-facing URL, not the tenant subdomain.
   */
  readonly url?: string;

  /**
   * Image assets — logo, mark, favicon, OG image. See
   * {@link IBrandAssets}.
   */
  readonly assets?: IBrandAssets;

  /**
   * Structured data for the JSON-LD Organization block. Search
   * engines consume this directly for the site's knowledge-graph
   * entry.
   */
  readonly organization?: {
    /**
     * Registered legal entity name. Falls back to `name` when
     * omitted. Rare — most brands leave this unset.
     */
    readonly legalName?: string;

    /**
     * URL to the brand's logo image for the JSON-LD block. Falls
     * back to `assets.logotipo.src` when omitted.
     */
    readonly logo?: string;

    /**
     * Related profile URLs (LinkedIn, X/Twitter, Facebook,
     * Instagram, GitHub). Each URL landed in JSON-LD
     * `Organization.sameAs`.
     */
    readonly sameAs?: readonly string[];
  };

  /**
   * Twitter Card metadata.
   */
  readonly twitter?: {
    /**
     * Twitter @handle including the leading `@`. Written as
     * `twitter:site`. Example: `"@stackra"`.
     */
    readonly handle?: string;
  };

  /**
   * BCP-47 locale for the primary language. Written as
   * `og:locale`. Defaults to `en_US` when omitted.
   */
  readonly locale?: string;
}
