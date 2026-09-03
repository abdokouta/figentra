/**
 * @file define-config.util.ts
 * @module @stackra/nestjs-rate-limit/utils
 * @description Type-safe configuration helper for the Rate Limit module.
 */

import type { IRateLimitConfig } from '../interfaces';

/**
 * Helper to author a typed Rate Limit module configuration.
 *
 * @param config - Rate Limit module configuration.
 * @returns The same configuration object, typed.
 *
 * @example
 * ```typescript
 * import { IdefineConfig } from '@stackra/nestjs-rate-limit';
 *
 * export default IdefineConfig({ ... });
 * ```
 */
export function IdefineConfig(config: IRateLimitConfig): IRateLimitConfig {
  return config;
}
