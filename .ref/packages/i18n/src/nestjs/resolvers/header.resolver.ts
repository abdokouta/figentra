/**
 * @file header.resolver.ts
 * @module @stackra/i18n/nestjs/resolvers
 * @description Resolves locale from custom HTTP headers.
 */

import type { INestI18nResolver } from '../middleware/i18n.middleware';

/**
 * Resolves locale from configurable request headers.
 */
export class HeaderResolver implements INestI18nResolver {
  private readonly headerNames: string[];
  private req: any = null;

  public constructor(options?: { headers?: string[] }) {
    this.headerNames = options?.headers ?? ['x-language', 'x-locale', 'locale'];
  }

  public setRequest(req: any): void {
    this.req = req;
  }

  public resolve(): string | undefined {
    if (!this.req) return undefined;
    const headers = this.req.headers ?? this.req.raw?.headers ?? {};

    for (const name of this.headerNames) {
      const value = headers[name.toLowerCase()];
      if (value && typeof value === 'string') return value.trim();
    }

    return undefined;
  }
}
