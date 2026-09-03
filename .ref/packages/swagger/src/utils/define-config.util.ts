/**
 * @file define-config.util.ts
 * @module @stackra/nestjs-swagger/utils
 * @description Type-safe config helper for Swagger configuration files.
 */

import type { ISwaggerConfig } from '../interfaces';

/**
 * Type-safe identity function for Swagger configuration.
 *
 * Provides IDE autocompletion and type checking in config files
 * without adding runtime overhead.
 *
 * @param config - Swagger configuration object.
 * @returns The same config object (identity pass-through).
 *
 * @example
 * ```typescript
 * // config/swagger.config.ts
 * import { IdefineConfig } from '@stackra/nestjs-swagger';
 *
 * export default IdefineConfig({
 *   title: 'My API',
 *   description: 'API docs',
 *   version: '1.0.0',
 *   apiPath: 'api/docs',
 *   enabled: true,
 *   serverUrl: 'http://localhost:3000',
 * });
 * ```
 */
export function IdefineConfig(config: ISwaggerConfig): ISwaggerConfig {
  return config;
}
