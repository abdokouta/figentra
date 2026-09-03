/**
 * @file nest-webhook.module.ts
 * @module @stackra/nestjs-webhook
 * @description NestWebhookModule — NestJS adapter for @stackra/ts-webhook.
 */

import { Module, type IDynamicModule } from '@nestjs/common';

// ============================================================================
// Module Options
// ============================================================================

// ============================================================================
// Module
// ============================================================================

/**
 * NestJS adapter module for the `webhook` feature.
 *
 * This module wraps the core `@stackra/ts-webhook` module and adds
 * NestJS-specific features:
 * - Guards and Interceptors for declarative route-level integration
 * - Discovery service integration for `@Subscribe` / `@OnEvent` etc.
 * - Health indicators (when applicable)
 *
 * The module is registered as **global** so its providers are accessible from
 * any feature module without explicit re-imports.
 *
 * @example
 * ```typescript
 * import { Module } from '@nestjs/common';
 * import { NestWebhookModule } from '@stackra/nestjs-webhook';
 *
 * @Module({
 *   imports: [NestWebhookModule.forRoot({})],
 * })
 * export class AppModule {}
 * ```
 *
 * @see https://docs.nestjs.com/modules
 */
@Module({})
export class NestWebhookModule {
  /**
   * Register the module globally with the provided options.
   *
   * Returns a `IDynamicModule` that NestJS resolves at bootstrap. All providers
   * declared here are eligible for injection across the application.
   *
   * @param options - Module configuration. Defaults to an empty object.
   * @returns A NestJS `IDynamicModule` definition.
   */
  public static forRoot(options: IWebhookModuleOptions = {}): IDynamicModule {
    return {
      module: NestWebhookModule,
      global: true,
      imports: [],
      providers: [],
      exports: [],
    };
  }
}
