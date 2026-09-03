/**
 * @file cookie.resolver.ts
 * @module @stackra/i18n/nestjs/resolvers
 * @description Resolves locale from HTTP cookies.
 */

import type { INestI18nResolver } from '../middleware/i18n.middleware';

/**
 * Resolves locale from request cookies.
 */
export class NestCookieResolver implements INestI18nResolver {
  private readonly cookieNames: string[];
  private req: any = null;

  public constructor(options?: { cookies?: string[] }) {
    this.cookieNames = options?.cookies ?? ['lang', 'locale'];
  }

  public setRequest(req: any): void {
    this.req = req;
  }

  public resolve(): string | undefined {
    if (!this.req) return undefined;
    const cookies = this.req.cookies ?? {};

    for (const name of this.cookieNames) {
      const value = cookies[name];
      if (value && typeof value === 'string') return value.trim();
    }

    return undefined;
  }
}
