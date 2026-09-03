/**
 * @file web-http.module.ts
 * @module @stackra/http/react
 * @description `WebHttpModule` — the React/web-runtime binding on
 *   top of {@link HttpModule}.
 *
 *   Composes `HttpModule.forRoot(config)` / `.forRootAsync(...)`.
 *   Kept as a thin wrapper so consumers importing this subpath
 *   have a stable entry point for future web-only bindings.
 */

import { Module, type DynamicModule } from "@stackra/container";
import type {
  IHttpModuleAsyncOptions,
  IHttpModuleOptions,
} from "@stackra/contracts";

import { HttpModule } from "../core/http.module";

/**
 * Web-runtime binding for `@stackra/http`.
 *
 * @example
 * ```typescript
 * import { registerAs, env, ConfigModule } from '@stackra/config';
 * import { WebHttpModule } from '@stackra/http/react';
 * import { HTTP_CONFIG } from '@stackra/contracts';
 *
 * const httpConfig = registerAs(HTTP_CONFIG, () => ({
 *   default: 'api',
 *   connections: {
 *     api: { baseURL: env('API_URL', '/api'), timeout: 10_000 },
 *   },
 * }));
 *
 * @Module({
 *   imports: [
 *     ConfigModule.forRoot({ isGlobal: true, load: [httpConfig] }),
 *     WebHttpModule.forRoot(sync(httpConfig())),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class WebHttpModule {
  /**
   * Sync entry point — takes a fully-formed {@link IHttpModuleOptions}.
   *
   * @param config - HTTP module options.
   */
  public static forRoot(config: IHttpModuleOptions): DynamicModule {
    return {
      module: WebHttpModule,
      global: true,
      imports: [HttpModule.forRoot(config)],
    };
  }

  /**
   * Async entry point — same shape as `HttpModule.forRootAsync`.
   *
   * @param options - Async options.
   */
  public static forRootAsync(options: IHttpModuleAsyncOptions): DynamicModule {
    return {
      module: WebHttpModule,
      global: true,
      imports: [HttpModule.forRootAsync(options)],
    };
  }
}
