/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/brand
 * @description Barrel export for brand interfaces + types.
 *
 *   The brand subsystem owns identity metadata — name, tagline,
 *   description, logo assets, favicon, OG tags, JSON-LD — anything
 *   HeroUI's CSS variables can't express.
 *
 *   Sibling: `theming/` — visual tokens (colors, radius, fonts).
 */

export type { IBrandAsset } from "./brand-asset.interface";
export type { IBrandAssets } from "./brand-assets.interface";
export type { IBrandMetadata } from "./brand-metadata.interface";
export type { IBrandPayload } from "./brand-payload.interface";
export type { IBrandBindings } from "./brand-bindings.interface";
export type { IBrandModuleOptions } from "./brand-module-options.interface";
export type { IBrandService } from "./brand-service.interface";
