/**
 * @file swagger-module-async-options.interface.ts
 * @module @stackra/swagger/src/interfaces
 * @description ISwaggerModuleAsyncOptions interface.
 */

/**
 * Async configuration options for `NestSwaggerModule.forRootAsync()`.
 */
export interface ISwaggerModuleAsyncOptions {
  /** Modules to import for dependency resolution. */
  imports?: any[];
  /** DI tokens to inject into the factory. */
  inject?: any[];
  /** Factory function returning the Swagger config. */
  useFactory: (...args: any[]) => Promise<ISwaggerConfig> | ISwaggerConfig;
}
