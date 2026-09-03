/**
 * @file nest-pagination.module.ts
 * @module @stackra/ts-pagination/nestjs
 * @description NestJS module for pagination with automatic request parameter
 *   resolution via middleware and optional response envelope interceptor.
 */

import {
  Module,
  type IDynamicModule,
  type MiddlewareConsumer,
  type NestModule,
} from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { PaginationModule } from '../core/pagination.module';
import type { IPaginationModuleConfig } from '../core/pagination.module';
import { PaginationResolverMiddleware } from './middleware/pagination-resolver.middleware';
import { PaginationResponseInterceptor } from './interceptors/pagination-response.interceptor';
import { PAGINATION_CONFIG } from '@stackra/contracts';

// ════════════════════════════════════════════════════════════════════════════════
// Options
// ════════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════

/**
 * NestJS pagination module with automatic request parameter resolution.
 *
 * Imports the core PaginationModule and adds:
 * - Middleware for reading pagination params from query strings
 * - Optional global interceptor for envelope formatting
 *
 * The middleware reads `page`, `per_page`, `cursor`, `sort`, and `order`
 * from query parameters and stores them in AsyncLocalStorage for access
 * anywhere in the request call stack.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     NestPaginationModule.forRoot({
 *       defaultPerPage: 15,
 *       maxPerPage: 100,
 *       enableInterceptor: true,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class NestPaginationModule implements NestModule {
  /**
   * Register the NestJS pagination module globally.
   *
   * @param config - Module configuration with NestJS-specific options
   * @returns Dynamic module definition
   */
  public static forRoot(config: INestPaginationModuleConfig = {}): IDynamicModule {
    const { enableInterceptor = true, ...coreConfig } = config;

    const providers: any[] = [PaginationResolverMiddleware];

    if (enableInterceptor) {
      providers.push({
        provide: APP_INTERCEPTOR,
        useClass: PaginationResponseInterceptor,
      });
    }

    return {
      module: NestPaginationModule,
      global: true,
      imports: [PaginationModule.forRoot(coreConfig)],
      providers,
      exports: [PAGINATION_CONFIG],
    };
  }

  /**
   * Configure the pagination resolver middleware for all routes.
   *
   * @param consumer - NestJS middleware consumer
   */
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(PaginationResolverMiddleware).forRoutes('*');
  }
}
