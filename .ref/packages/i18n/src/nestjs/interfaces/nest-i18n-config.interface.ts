/**
 * @file nest-i18n-config.interface.ts
 * @module @stackra/i18n/src/interfaces
 * @description INestI18nConfig interface.
 */

/**
 * NestJS-specific i18n configuration.
 *
 * Extends the core config with NestJS middleware options.
 * Overrides `resolvers` to use NestJS-specific resolver instances.
 */
export interface INestI18nConfig extends Omit<II18nConfig, 'resolvers'> {
  /** Ordered locale resolvers (first match wins). Default: [Header, Query, Cookie, AcceptLanguage] */
  resolvers?: INestI18nResolver[];

  /** Disable the locale resolution middleware entirely. Default: false */
  disableMiddleware?: boolean;

  /** Route paths to exclude from locale resolution. Default: [] */
  excludePaths?: string[];
}
