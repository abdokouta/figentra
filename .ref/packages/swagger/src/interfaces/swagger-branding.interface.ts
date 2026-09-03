/**
 * @file swagger-branding.interface.ts
 * @module @stackra/nestjs-swagger/interfaces
 * @description Interface for Swagger UI branding and theming options.
 */

/**
 * Branding and visual customization for Swagger UI.
 */
export interface ISwaggerBranding {
  /** Swagger UI theme name (from swagger-themes package). */
  theme?: string;
  /** Custom HTML page title. */
  customSiteTitle?: string;
  /** Custom favicon URL. */
  customFavIcon?: string;
  /** Custom CSS URL (loaded externally). */
  customCssUrl?: string;
  /** Custom JavaScript URL. */
  customJsUrl?: string;
  /** Logo URL (replaces Swagger topbar logo). */
  logoUrl?: string;
}
