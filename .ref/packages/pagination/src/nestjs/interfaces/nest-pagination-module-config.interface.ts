/**
 * @file nest-pagination-module-config.interface.ts
 * @module @stackra/pagination/src/interfaces
 * @description INestPaginationModuleConfig interface.
 */

/**
 * Configuration options for the NestPaginationModule.
 */
export interface INestPaginationModuleConfig extends IPaginationModuleConfig {
  /** Whether to register the global response interceptor. Defaults to true. */
  enableInterceptor?: boolean;
}
