/**
 * @file response.config.ts
 * @module @stackra/nestjs-response/config
 * @description Preset configuration for the response module.
 */

import { IdefineConfig } from '../src/utils';

/**
 * Default response configuration preset.
 *
 * @example
 * ```typescript
 * import responseConfig from '@stackra/nestjs-response/config/response.config';
 * NestResponseModule.forRoot(responseConfig);
 * ```
 */
const responseConfig = IdefineConfig({
  envelope: true,
  timestamp: true,
  requestId: true,
});

export default responseConfig;
