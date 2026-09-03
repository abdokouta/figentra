/**
 * @file i18n.middleware.ts
 * @module @stackra/i18n/nestjs/middleware
 * @description Per-request locale resolution middleware.
 *   Resolves the locale from HTTP request (headers, query, cookie) and
 *   attaches it to the request object for downstream access.
 */

import type { NextFunction } from 'express';

import type { II18nResolver } from '../../core/interfaces';

/**
 * I18n middleware — resolves locale per request and attaches to `req.locale`.
 *
 * Resolver chain is tried in order. First non-undefined wins.
 * Falls back to `defaultLocale` if no resolver matches.
 */
export class I18nMiddleware {
  private readonly resolvers: INestI18nResolver[];
  private readonly defaultLocale: string;
  private readonly supportedLocales: string[];

  public constructor(options: {
    resolvers: INestI18nResolver[];
    defaultLocale: string;
    supportedLocales: string[];
  }) {
    this.resolvers = options.resolvers;
    this.defaultLocale = options.defaultLocale;
    this.supportedLocales = options.supportedLocales;
  }

  /**
   * Middleware handler.
   */
  public use(req: any, _res: any, next: NextFunction): void {
    let resolvedLocale: string | undefined;

    for (const resolver of this.resolvers) {
      // Inject request context into the resolver
      if (resolver.setRequest) {
        resolver.setRequest(req);
      }

      const result = resolver.resolve();
      resolvedLocale = Array.isArray(result) ? result[0] : result;

      if (resolvedLocale && this.supportedLocales.includes(resolvedLocale)) {
        break;
      }
      resolvedLocale = undefined;
    }

    req.locale = resolvedLocale ?? this.defaultLocale;
    req.i18nLang = req.locale;

    next();
  }
}
