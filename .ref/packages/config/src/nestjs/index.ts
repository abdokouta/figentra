/**
 * @file index.ts
 * @module @stackra/config/nestjs
 * @description Public API for the @stackra/config NestJS adapter.
 *   Re-exports core config system plus NestJS-specific features.
 */

// ════════════════════════════════════════════════════════════════════════════════
// NestJS Module
// ════════════════════════════════════════════════════════════════════════════════
export { NestConfigModule } from './nest-config.module';
export type { INestConfigModuleOptions } from './nest-config.module';

// ════════════════════════════════════════════════════════════════════════════════
// NestJS Services
// ════════════════════════════════════════════════════════════════════════════════
export { ConfigurationLoader } from './services/configuration-loader.service';
export {
  SecretsDriverLoader,
  SECRETS_DRIVER_METADATA_KEY,
} from './services/secrets-driver-loader.service';
export { TenantConfigService } from './services/tenant-config.service';
export { ConfigPublisher } from './services/config-publisher.service';
export { ConfigHotReloadService } from './services/config-hot-reload.service';

// ════════════════════════════════════════════════════════════════════════════════
// NestJS Decorators
// ════════════════════════════════════════════════════════════════════════════════
export { SecretsDriver } from './decorators';
export { Configuration, CONFIGURATION_METADATA_KEY } from './decorators';

// ════════════════════════════════════════════════════════════════════════════════
// NestJS Health
// ════════════════════════════════════════════════════════════════════════════════
export { ConfigHealthIndicator } from './health/config-health.indicator';

// ════════════════════════════════════════════════════════════════════════════════
// NestJS Drivers (Node.js only)
// ════════════════════════════════════════════════════════════════════════════════
export { FileDriver } from './drivers/file.driver';
export type { IFileDriverOptions } from './drivers/file.driver';
export { DopplerSecretsDriver } from './drivers/doppler-secrets.driver';
export type { IDopplerSecretsDriverOptions } from './drivers/doppler-secrets.driver';

// ════════════════════════════════════════════════════════════════════════════════
// Re-export Core (convenience — consumers only need one import)
// ════════════════════════════════════════════════════════════════════════════════
export {
  ConfigModule,
  getConfigSourceToken,
  ConfigManager,
  ConfigService,
  ConfigSchemaRegistry,
  EnvDriver,
  MemoryDriver,
  StaticDriver,
  HttpDriver,
  InjectConfig,
  InjectConfigManager,
  Value,
  getValueProperties,
  getValueMetadata,
  defineConfig,
  getPendingConfigs,
  clearPendingConfigs,
  getNestedValue,
  hasNestedValue,
  registerAs,
  env,
  envOrFail,
  flatten,
  unflatten,
} from '../core/index';
export type {
  IConfigServiceOptions,
  IConfigEventEmitter,
  IEnvDriverOptions,
  IHttpDriverOptions,
  IValueOptions,
  IValueMetadata,
  IConfigViolation,
} from '../core/index';
