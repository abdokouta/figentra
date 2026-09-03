/**
 * @file query.resolver.ts
 * @module @stackra/i18n/nestjs/resolvers
 * @description Resolves locale from URL query parameters.
 */

import type { INestI18nResolver } from '../middleware/i18n.middleware';

/**
 * Resolves locale from query parameters.
 */
export class QueryResolver implements INestI18nResolver {
  private readonly paramNames: string[];
  private req: any = null;

  public constructor(options?: { params?: string[] }) {
    this.paramNames = options?.params ?? ['lang', 'locale', 'language'];
  }

  public setRequest(req: any): void {
    this.req = req;
  }

  public resolve(): string | undefined {
    if (!this.req) return undefined;
    const query = this.req.query ?? {};

    for (const param of this.paramNames) {
      const value = query[param];
      if (value && typeof value === 'string') return value.trim();
    }

    return undefined;
  }
}
