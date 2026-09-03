/**
 * @file nest-response.module.ts
 * @module @stackra/nestjs-response
 * @description NestResponseModule — NestJS adapter for @stackra/ts-response.
 *
 *   All interceptors, filters, and middleware are auto-registered via
 *   APP_INTERCEPTOR, APP_FILTER tokens and NestModule.configure() — no manual
 *   `app.useGlobal*()` calls needed.
 */

import {
  Module,
  type IDynamicModule,
  type MiddlewareConsumer,
  type NestModule,
} from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

import type { IResponseModuleConfig } from './interfaces/response-config.interface';
import { RESPONSE_CONFIG, RESPONSE_DEFAULTS } from './constants';
import { ResponseInterceptor } from './http/interceptors/response.interceptor';
import { GlobalExceptionFilter } from './http/filters/global-exception.filter';
import { ValidationExceptionFilter } from './http/filters/validation-exception.filter';
import { RequestContextMiddleware } from './http/middleware/request-context.middleware';
import { ResponsePipeline } from './pipeline/response-pipeline.service';
import { ErrorFormatterService } from './errors/error-formatter.service';
import { ResponseContext } from './context/response-context.service';

// ============================================================================
// Module
// ============================================================================

/**
 * NestJS adapter module for the `response` feature.
 *
 * Provides a complete response infrastructure layer:
 * - `ResponseInterceptor` (APP_INTERCEPTOR) — wraps all responses in the standard envelope
 * - `GlobalExceptionFilter` (APP_FILTER) — catches all exceptions, returns error envelope
 * - `ValidationExceptionFilter` (APP_FILTER) — catches validation errors, returns 422
 * - `RequestContextMiddleware` — propagates X-Request-ID and X-Trace-ID headers
 *
 * The module is registered as **global** so its providers are accessible from
 * any feature module without explicit re-imports.
 *
 * @example
 * ```typescript
 * import { Module } from '@nestjs/common';
 * import { NestResponseModule } from '@stackra/nestjs-response';
 *
 * @Module({
 *   imports: [
 *     NestResponseModule.forRoot({
 *       envelope: { enabled: true, includeRequestId: true },
 *       debug: { enabled: process.env.NODE_ENV !== 'production' },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class NestResponseModule implements NestModule {
  /**
   * Configure middleware for request context propagation.
   *
   * @param consumer - NestJS middleware consumer
   */
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }

  /**
   * Register the module globally with the provided options.
   *
   * All interceptors and filters are auto-registered via APP_INTERCEPTOR and
   * APP_FILTER tokens. Middleware is registered via `configure()`.
   *
   * @param options - Module configuration. Merged with defaults.
   * @returns A NestJS `IDynamicModule` definition.
   */
  public static forRoot(options: Partial<IResponseModuleConfig> = {}): IDynamicModule {
    const config: IResponseModuleConfig = {
      ...RESPONSE_DEFAULTS,
      ...options,
      envelope: { ...RESPONSE_DEFAULTS.envelope, ...options.envelope },
      debug: { ...RESPONSE_DEFAULTS.debug, ...options.debug },
    };

    return {
      module: NestResponseModule,
      global: true,
      providers: [
        // Configuration
        { provide: RESPONSE_CONFIG, useValue: config },

        // Core services
        ResponsePipeline,
        ErrorFormatterService,
        ResponseContext,
        RequestContextMiddleware,

        // ====================================================================
        // Global Interceptors (APP_INTERCEPTOR)
        // ====================================================================

        /** Standard response envelope wrapping. */
        { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },

        // ====================================================================
        // Global Exception Filters (APP_FILTER)
        // ====================================================================

        /** Validation errors → 422 with field-level details. */
        { provide: APP_FILTER, useClass: ValidationExceptionFilter },
        /** All other exceptions → standard error envelope. */
        { provide: APP_FILTER, useClass: GlobalExceptionFilter },
      ],
      exports: [RESPONSE_CONFIG, ResponsePipeline, ErrorFormatterService, ResponseContext],
    };
  }
}
