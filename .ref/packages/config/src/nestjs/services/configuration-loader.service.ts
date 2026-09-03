/**
 * @file configuration-loader.service.ts
 * @module @stackra/config/nestjs/services
 * @description Discovers @Configuration() decorated classes and populates
 *   their @Value() decorated properties from the config system.
 *   Uses DISCOVERY_SERVICE token for platform-agnostic provider scanning.
 */

import { IInjectable, Inject, Optional } from '@nestjs/common';
import type { IOnModuleInit } from '@nestjs/common';

import { CONFIG_MANAGER, DISCOVERY_SERVICE, type IDiscoveryService } from '@stackra/contracts';
import type { ConfigManager } from '../../core/services/config-manager.service';
import { getValueProperties, getValueMetadata } from '../../core/decorators';
import { CONFIGURATION_METADATA_KEY } from '../decorators';
import { getMetadata } from '@vivtel/metadata';

// ════════════════════════════════════════════════════════════════════════════════
// Service
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Configuration loader service.
 *
 * Discovers all classes decorated with `@Configuration()` via the
 * platform-agnostic `IDiscoveryService` and populates their `@Value()`
 * properties from the config system on module initialization.
 *
 * @example
 * ```typescript
 * @Configuration()
 * @IInjectable()
 * class DatabaseConfig {
 *   @Value('database.host', { default: 'localhost' })
 *   host!: string;
 *
 *   @Value('database.port', { default: 5432, parse: Number })
 *   port!: number;
 * }
 * ```
 */
@IInjectable()
export class ConfigurationLoader implements IOnModuleInit {
  /**
   * @param configManager - The config manager for reading values
   * @param discovery - Platform-agnostic discovery service for scanning providers
   */
  public constructor(
    @Inject(CONFIG_MANAGER) private readonly configManager: ConfigManager,
    @Optional()
    @Inject(DISCOVERY_SERVICE)
    private readonly discovery?: IDiscoveryService
  ) {}

  /**
   * Scan for @Configuration() classes and populate @Value() properties.
   *
   * Called automatically after all module providers are instantiated.
   */
  public onModuleInit(): void {
    if (!this.discovery) return;

    const providers = this.discovery.getProviders();
    const config = this.configManager.source();

    for (const { instance, metatype } of providers) {
      if (!instance || !metatype) continue;

      // Check for @Configuration() metadata
      const isConfiguration = getMetadata<boolean>(CONFIGURATION_METADATA_KEY, metatype);
      if (!isConfiguration) continue;

      // Get @Value() decorated properties from prototype
      const proto = metatype.prototype ?? metatype;
      const valueProperties = getValueProperties(proto);
      if (!valueProperties || valueProperties.length === 0) continue;

      // Populate each property from config
      for (const propertyKey of valueProperties) {
        const metadata = getValueMetadata(proto, propertyKey);
        if (!metadata) continue;

        const value = config.get(metadata.key, metadata.options.default);
        if (value !== undefined) {
          const resolved = metadata.options.parse ? metadata.options.parse(value) : value;
          (instance as Record<string, unknown>)[propertyKey as string] = resolved;
        }
      }
    }
  }
}
