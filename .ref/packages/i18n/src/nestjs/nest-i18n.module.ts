/**
 * @file nest-i18n.module.ts
 * @module @stackra/i18n/nestjs
 * @description NestJS i18n adapter module.
 *
 *   Wraps the core `I18nModule` and adds NestJS-specific features:
 *   - Per-request locale resolution middleware
 *   - Ordered resolver chain (Header → Query → Cookie → Accept-Language)
 *   - Request-scoped locale attached to `req.locale`
 *
 *   Follows the standard NestJS adapter pattern:
 *   1. Imports core `I18nModule.forRoot(config)` for all services
 *   2. Registers NestJS-specific providers (middleware, resolvers)
 *   3. Applies middleware via `configure()` lifecycle
 *
 *   ## Usage
 *
 *   ```typescript
 *   import { NestI18nModule } from '@stackra/i18n/nestjs';
 *
 *   @Module({
 *     imports: [
 *       NestI18nModule.forRoot({
 *         defaultLocale: 'en',
 *         supportedLocales: ['en', 'ar'],
 *         loader: JsonFileLoader,
 *         loaderOptions: { path: './i18n' },
 *       }),
 *     ],
 *   })
 *   export class AppModule {}
 *   ```
 */

import {
  Inject,
  Module,
  type IDynamicModule,
  type MiddlewareConsumer,
  type NestModule,
} from '@nestjs/common';
import { I18nModule } from '../core/i18n.module';
import type { II18nConfig } from '../core/interfaces';
import { I18nMiddleware } from './middleware/i18n.middleware';
import type { INestI18nResolver } from './middleware/i18n.middleware';
import { AcceptLanguageResolver } from './resolvers/accept-language.resolver';
import { HeaderResolver } from './resolvers/header.resolver';
import { QueryResolver } from './resolvers/query.resolver';
import { NestCookieResolver } from './resolvers/cookie.resolver';

// ============================================================================
// Constants
// ============================================================================

// ============================================================================
// Configuration
// ============================================================================

// ============================================================================
// Module
// ============================================================================

/**
 * NestJS i18n adapter module.
 *
 * Provides per-request locale resolution via configurable resolver chain.
 * Attaches `req.locale` and `req.i18nLang` to every incoming request.
 *
 * Resolver execution order matters — first resolver that returns a valid
 * supported locale wins. Default chain:
 * 1. `X-Language` / `X-Locale` header
 * 2. `?lang=` query parameter
 * 3. `locale` cookie
 * 4. `Accept-Language` header (quality-weighted)
 * 5. Fallback to `defaultLocale`
 */
@Module({})
export class NestI18nModule implements NestModule {
  public constructor(
    @Inject(NEST_I18N_CONFIG) private readonly config: INestI18nConfig,
    @Inject(I18N_RESOLVERS) private readonly resolvers: INestI18nResolver[]
  ) {}

  /**
   * Apply the i18n locale resolution middleware to all routes.
   *
   * @param consumer - NestJS middleware consumer
   */
  public configure(consumer: MiddlewareConsumer): void {
    if (this.config.disableMiddleware) return;

    const middleware = new I18nMiddleware({
      resolvers: this.resolvers,
      defaultLocale: this.config.defaultLocale,
      supportedLocales: this.config.supportedLocales,
    });

    let builder = consumer.apply(middleware.use.bind(middleware));

    if (this.config.excludePaths?.length) {
      builder = builder.exclude(...this.config.excludePaths);
    }

    builder.forRoutes('*');
  }

  /**
   * Register the NestJS i18n module.
   *
   * @param config - NestJS i18n configuration
   * @returns Dynamic module definition
   */
  public static forRoot(config: INestI18nConfig): IDynamicModule {
    const { resolvers: nestResolvers, disableMiddleware, excludePaths, ...coreConfig } = config;

    const resolvers = nestResolvers ?? [
      new HeaderResolver(),
      new QueryResolver(),
      new NestCookieResolver(),
      new AcceptLanguageResolver({ supportedLocales: config.supportedLocales }),
    ];

    return {
      module: NestI18nModule,
      global: true,
      imports: [I18nModule.forRoot(coreConfig)],
      providers: [
        { provide: NEST_I18N_CONFIG, useValue: config },
        { provide: I18N_RESOLVERS, useValue: resolvers },
      ],
      exports: [NEST_I18N_CONFIG, I18N_RESOLVERS],
    };
  }
}
