/**
 * @file brand-asset.interface.ts
 * @module @stackra/contracts/interfaces/brand
 * @description Metadata for a single brand image asset.
 *
 *   Consumed by `<BrandLogo>` / `<BrandMark>` to render the correct
 *   `<img>` element (or by `BrandService` to write the `<link
 *   rel="icon">` href for the favicon).
 */

/**
 * A single brand image asset — logo, mark, favicon, OG image.
 */
export interface IBrandAsset {
  /**
   * Fully qualified URL or absolute path to the image. Loaded
   * directly by the `<img>` element — no runtime processing.
   */
  readonly src: string;

  /**
   * Alternative text. Falls back to `IBrandMetadata.name` when
   * omitted. Screen readers read this aloud; consumers must set
   * it on assets meant to be accessible.
   */
  readonly alt?: string;

  /**
   * Intrinsic width in CSS pixels. Consumed by `<img width>` to
   * avoid layout shift when the image loads.
   */
  readonly width?: number;

  /**
   * Intrinsic height in CSS pixels. Consumed by `<img height>` to
   * avoid layout shift when the image loads.
   */
  readonly height?: number;
}
