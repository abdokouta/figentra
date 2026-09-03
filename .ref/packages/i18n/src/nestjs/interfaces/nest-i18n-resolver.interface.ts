/**
 * @file nest-i18n-resolver.interface.ts
 * @module @stackra/i18n/src/interfaces
 * @description INestI18nResolver interface.
 */

/**
 * NestJS-compatible i18n resolver interface for HTTP context.
 * Extends the core resolver but receives the request in the constructor
 * or via a `setRequest()` call before `resolve()`.
 */
export interface INestI18nResolver extends II18nResolver {
  /**
   * Set the current request context for resolution.
   * Called by the middleware before invoking resolve().
   */
  setRequest?(req: any): void;
}
