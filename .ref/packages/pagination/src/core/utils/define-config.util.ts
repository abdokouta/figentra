/**
 * @file define-config.util.ts
 * @module @stackra/ts-pagination/core/utils
 * @description Type-safe pagination configuration builder.
 *   Merges user-provided partial config with defaults from the constant.
 */

import type { IPaginationModuleConfig } from '../pagination.module';
import { DEFAULT_CONFIG } from '../constants';

/**
 * Create a type-safe pagination module configuration with defaults.
 *
 * Merges the provided partial config with `DEFAULT_CONFIG`.
 * Use this in your application's config file for type safety and autocomplete.
 *
 * @param config - Partial configuration to merge with defaults
 * @returns Complete pagination module configuration
 *
 * @example
 * ```typescript
 * import { IdefineConfig } from '@stackra/ts-pagination';
 *
 * export default IdefineConfig({
 *   defaultPerPage: 25,
 *   maxPerPage: 50,
 * });
 * ```
 */
export function IdefineConfig(
  config: IPaginationModuleConfig = {}
): Required<IPaginationModuleConfig> {
  return {
    ...DEFAULT_CONFIG,
    ...config,
  };
}
