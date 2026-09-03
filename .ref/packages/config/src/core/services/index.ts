/**
 * @file index.ts
 * @module @stackra/config/core/services
 * @description Barrel export for config services.
 */

export { ConfigManager } from './config-manager.service';
export { ConfigService } from './config.service';
export type { IConfigServiceOptions, IConfigEventEmitter } from './config.service';
export { ConfigSchemaRegistry } from './config-schema-registry.service';
