/**
 * @file accept-language.resolver.ts
 * @module @stackra/i18n/nestjs/resolvers
 * @description Resolves locale from the Accept-Language HTTP header.
 */

import type { INestI18nResolver } from '../middleware/i18n.middleware';

/**
 * Resolves locale from the `Accept-Language` header.
 */
export class AcceptLanguageResolver implements INestI18nResolver {
  private readonly supportedLocales: string[];
  private req: any = null;

  public constructor(options?: { supportedLocales?: string[] }) {
    this.supportedLocales = options?.supportedLocales ?? [];
  }

  public setRequest(req: any): void {
    this.req = req;
  }

  public resolve(): string | undefined {
    if (!this.req) return undefined;

    const header: string | undefined =
      this.req.headers?.['accept-language'] ?? this.req.raw?.headers?.['accept-language'];

    if (!header) return undefined;

    const parsed = parseAcceptLanguage(header);

    for (const { locale } of parsed) {
      if (this.supportedLocales.includes(locale)) return locale;
      const base = locale.split('-')[0]!;
      if (this.supportedLocales.includes(base)) return base;
    }

    return undefined;
  }
}

function parseAcceptLanguage(header: string): Array<{ locale: string; quality: number }> {
  return header
    .split(',')
    .map((part) => {
      const [locale, qualityStr] = part.trim().split(';q=');
      return { locale: locale!.trim(), quality: qualityStr ? parseFloat(qualityStr) : 1.0 };
    })
    .sort((a, b) => b.quality - a.quality);
}
