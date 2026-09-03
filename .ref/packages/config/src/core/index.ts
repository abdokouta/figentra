/**
 * @file index.ts
 * @module @stackra/config/core
 * @description Public API for the @stackra/config core module.
 *   Platform-agnostic config management with pluggable drivers,
 *   typed getters, runtime overrides, sensitive key masking,
 *   encryption, and event emission.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════
export { ConfigModule, getConfigSourceToken } from './config.module';

// ════════════════════════════════════════════════════════════════════════════════
// Services
// ════════════════════════════════════════════════════════════════════════════════
export { ConfigManager } from './services';
export { ConfigService } from './services';
export { ConfigSchemaRegistry } from './services';
export type { IConfigServiceOptions, IConfigEventEmitter } from './services/config.service';

// ════════════════════════════════════════════════════════════════════════════════
// Drivers
// ════════════════════════════════════════════════════════════════════════════════
export { EnvDriver } from './drivers';
export type { IEnvDriverOptions } from './drivers';
export { MemoryDriver } from './drivers';
export { StaticDriver } from './drivers';
export { HttpDriver } from './drivers';
export type { IHttpDriverOptions } from './drivers';

// ════════════════════════════════════════════════════════════════════════════════
// Contracts (re-export from @stackra/contracts for convenience)
// ════════════════════════════════════════════════════════════════════════════════
export {
  CONFIG_MANAGER,
  CONFIG_SERVICE,
  CONFIG_OPTIONS,
  CONFIG_SCHEMA_REGISTRY,
  CONFIG_EVENTS,
} from '@stackra/contracts';

export type {
  IConfigDriver,
  IConfigService,
  IConfigManager,
  IConfigTrace,
  ISecretsDriver,
  ITenantConfigRepository,
  IFeatureFlagResolver,
  IConfigSchemaEntry,
  IConfigFactory,
  IConfigModuleOptions,
  IConfigSourceOptions,
  IConfigModuleAsyncOptions,
} from '@stackra/contracts';

// ════════════════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════════════════
export {
  DEFAULT_CONFIG_OPTIONS,
  SUPPORTED_DRIVERS,
  SYNC_DRIVERS,
  ASYNC_DRIVERS,
} from './constants';

// ════════════════════════════════════════════════════════════════════════════════
// Decorators
// ════════════════════════════════════════════════════════════════════════════════
export { InjectConfig } from './decorators';
export { InjectConfigManager } from './decorators';
export { Value, getValueProperties, getValueMetadata } from './decorators';
export type { IValueOptions, IValueMetadata } from './decorators';

// ════════════════════════════════════════════════════════════════════════════════
// Errors
// ════════════════════════════════════════════════════════════════════════════════
export {
  ConfigError,
  ConfigMissingKeyError,
  ConfigSourceError,
  ConfigValidationError,
  ConfigEncryptionError,
} from './errors';
export type { IConfigViolation } from './errors';

// ════════════════════════════════════════════════════════════════════════════════
// Utilities
// ════════════════════════════════════════════════════════════════════════════════
export { defineConfig, getPendingConfigs, clearPendingConfigs } from './utils';
export { getNestedValue, hasNestedValue } from './utils';
export { registerAs } from './utils';
export { env, envOrFail } from './utils';
export { flatten, unflatten } from './utils';

// ============================================================================
// Commands (auto-discovered by @stackra/console)
// ============================================================================
