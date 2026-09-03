/**
 * @file nest-config.module.ts
 * @module @stackra/config/nestjs
 * @description NestJS adapter module for the config system.
 *   Wraps the core ConfigModule and adds NestJS-specific features:
 *   - @Configuration() class discovery via DISCOVERY_SERVICE
 *   - Tenant-scoped config via request context
 *   - Secrets driver discovery
 *   - Health indicator for remote sources
 *   - File driver with glob scanning
 */

import { Module, type IDynamicModule } from '@nestjs/common';

import type { IConfigModuleOptions } from '@stackra/contracts';
import { CONFIG_MANAGER, CONFIG_SERVICE, CONFIG_OPTIONS } from '@stackra/contracts';
import { ConfigManager } from '../core/services/config-manager.service';
import { ConfigurationLoader } from './services/configuration-loader.service';
import { SecretsDriverLoader } from './services/secrets-driver-loader.service';
import { ConfigHealthIndicator } from './health/config-health.indicator';

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════

/**
 * NestJS config adapter module.
 *
 * Wraps `@stackra/config` core and adds:
 * - IDiscoveryService-based @Configuration() auto-discovery
 * - ConfigHealthIndicator for health checks
 * - SecretsDriverLoader for @SecretsDriver() discovery
 * - Expandable variable resolution
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     NestConfigModule.forRoot({
 *       default: 'env',
 *       sources: {
 *         env: { driver: 'env', expandVariables: true },
 *       },
 *       sensitiveKeys: ['DB_PASSWORD', 'JWT_SECRET'],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class NestConfigModule {
  /**
   * Register the NestJS config module globally.
   *
   * @param options - Config module options (superset of core options)
   * @returns Dynamic module definition
   */
  public static forRoot(options: INestConfigModuleOptions = {}): IDynamicModule {
    const config: IConfigModuleOptions = {
      default: options.default ?? 'env',
      sources: options.sources ?? { env: { driver: 'env' } },
      load: options.load,
      validate: options.validate,
      debug: options.debug,
      sensitiveKeys: options.sensitiveKeys,
      encryptionKey: options.encryptionKey,
    };

    return {
      module: NestConfigModule,
      global: true,
      providers: [
        { provide: CONFIG_OPTIONS, useValue: config },
        { provide: CONFIG_MANAGER, useClass: ConfigManager },
        {
          provide: CONFIG_SERVICE,
          useFactory: (manager: ConfigManager) => manager.source(),
          inject: [CONFIG_MANAGER],
        },
        ConfigManager,
        ConfigurationLoader,
        SecretsDriverLoader,
        ConfigHealthIndicator,
      ],
      exports: [
        CONFIG_MANAGER,
        CONFIG_SERVICE,
        CONFIG_OPTIONS,
        ConfigManager,
        ConfigurationLoader,
        SecretsDriverLoader,
        ConfigHealthIndicator,
      ],
    };
  }
}
