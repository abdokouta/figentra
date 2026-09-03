/**
 * @file index.ts
 * @module @stackra/config/core/decorators
 * @description Barrel export for config decorators.
 */

export { InjectConfig } from './inject-config.decorator';
export { InjectConfigManager } from './inject-config-manager.decorator';
export { Value, getValueProperties, getValueMetadata } from './value.decorator';
export type { IValueOptions, IValueMetadata } from './value.decorator';
