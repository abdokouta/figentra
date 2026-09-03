/**
 * @file nest-swagger.module.ts
 * @module @stackra/nestjs-swagger
 * @description NestJS Swagger/OpenAPI documentation module.
 *   Provides production-ready API documentation with configurable auth schemes,
 *   theming, branding, and environment-aware security.
 *
 *   The `ApiResponseInterceptor` is auto-registered via APP_INTERCEPTOR — no
 *   manual `app.useGlobalInterceptors()` needed.
 *
 *   ## Usage
 *   ```typescript
 *   // app.module.ts
 *   NestSwaggerModule.forRoot({
 *     title: 'My API',
 *     description: 'API documentation',
 *     version: '1.0.0',
 *     apiPath: 'api/docs',
 *     enabled: process.env.NODE_ENV !== 'production',
 *     serverUrl: 'http://localhost:3000',
 *     security: { jwt: { enabled: true, name: 'JWT-auth', description: 'JWT' } },
 *   })
 *
 *   // main.ts
 *   const swagger = app.get(SwaggerSetupService);
 *   swagger.setup(app);
 *   ```
 */

import { Module, type IDynamicModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { SWAGGER_CONFIG_TOKEN } from './constants';
import type { ISwaggerConfig } from './interfaces';
import { SwaggerBuilderService, SwaggerSetupService } from './services';
import { ApiResponseInterceptor } from './interceptors';

// ============================================================================
// Async Options
// ============================================================================

// ============================================================================
// Module
// ============================================================================

/**
 * NestJS Swagger documentation module.
 *
 * Register via `forRoot()` or `forRootAsync()` in your root AppModule.
 * Then call `SwaggerSetupService.setup(app)` in `main.ts`.
 *
 * Auto-registers:
 * - `ApiResponseInterceptor` (APP_INTERCEPTOR) — wraps all REST responses
 *   in the standardized envelope format.
 */
@Module({})
export class NestSwaggerModule {
  /**
   * Register the Swagger module with static configuration.
   *
   * @param config - Complete Swagger configuration.
   * @returns Global dynamic module.
   */
  public static forRoot(config: ISwaggerConfig): IDynamicModule {
    return {
      module: NestSwaggerModule,
      global: true,
      providers: [
        { provide: SWAGGER_CONFIG_TOKEN, useValue: config },
        SwaggerBuilderService,
        SwaggerSetupService,

        // ====================================================================
        // Global Interceptors (APP_INTERCEPTOR)
        // ====================================================================

        /** Wraps all REST responses in the standard envelope. */
        { provide: APP_INTERCEPTOR, useClass: ApiResponseInterceptor },
      ],
      exports: [SwaggerSetupService, SwaggerBuilderService, SWAGGER_CONFIG_TOKEN],
    };
  }

  /**
   * Register the Swagger module with async configuration.
   *
   * Supports injecting `ConfigService` or other providers for credential resolution.
   *
   * @param options - Async factory configuration.
   * @returns Global dynamic module.
   */
  public static forRootAsync(options: ISwaggerModuleAsyncOptions): IDynamicModule {
    return {
      module: NestSwaggerModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        {
          provide: SWAGGER_CONFIG_TOKEN,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        SwaggerBuilderService,
        SwaggerSetupService,

        // ====================================================================
        // Global Interceptors (APP_INTERCEPTOR)
        // ====================================================================

        /** Wraps all REST responses in the standard envelope. */
        { provide: APP_INTERCEPTOR, useClass: ApiResponseInterceptor },
      ],
      exports: [SwaggerSetupService, SwaggerBuilderService, SWAGGER_CONFIG_TOKEN],
    };
  }
}
