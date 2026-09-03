/**
 * @file pagination.module.ts
 * @module @stackra/ts-pagination/core
 * @description DI module for the pagination system.
 *   Registers the pagination configuration as a global singleton,
 *   making default settings available to all consumers.
 */

import { Module, type IDynamicModule } from '@stackra/ts-container';
import { DEFAULT_CONFIG } from './constants';
import { PAGINATION_CONFIG } from '@stackra/contracts';

// ════════════════════════════════════════════════════════════════════════════════
// Configuration Interface
// ════════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Core pagination DI module.
 *
 * Provides the pagination configuration to the DI container. Use `forRoot()`
 * to register globally with custom defaults.
 *
 * @example
 * ```typescript
 * PaginationModule.forRoot({
 *   defaultPerPage: 15,
 *   maxPerPage: 100,
 *   pageParam: 'page',
 *   perPageParam: 'per_page',
 *   cursorParam: 'cursor',
 * });
 * ```
 */
@Module({})
export class PaginationModule {
  /**
   * Register the pagination module globally with configuration.
   *
   * @param config - Partial configuration (missing keys use defaults)
   * @returns Dynamic module definition
   */
  public static forRoot(config: IPaginationModuleConfig = {}): IDynamicModule {
    const mergedConfig: Required<IPaginationModuleConfig> = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    return {
      module: PaginationModule,
      global: true,
      providers: [
        {
          provide: PAGINATION_CONFIG,
          useValue: mergedConfig,
        },
      ],
      exports: [PAGINATION_CONFIG],
    };
  }
}
