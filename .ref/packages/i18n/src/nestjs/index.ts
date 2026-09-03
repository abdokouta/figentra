/**
 * @file index.ts
 * @module @stackra/i18n/nestjs
 * @description NestJS i18n adapter — per-request locale resolution,
 *   middleware, resolvers, and request-scoped translation context.
 */

// ============================================================================
// Module
// ============================================================================

export { NestI18nModule } from './nest-i18n.module';
export type { INestI18nConfig } from './nest-i18n.module';

// ============================================================================
// Middleware
// ============================================================================

export { I18nMiddleware } from './middleware/i18n.middleware';
export type { INestI18nResolver } from './middleware/i18n.middleware';

// ============================================================================
// Resolvers
// ============================================================================

export { AcceptLanguageResolver } from './resolvers';
export { HeaderResolver } from './resolvers';
export { QueryResolver } from './resolvers';
export { NestCookieResolver } from './resolvers';

// ============================================================================
// Re-exports from core (convenience)
// ============================================================================

export { I18nManager } from '../core/services';
export { I18nLocaleService } from '../core/services';
