/**
 * @file secrets-driver-loader.service.ts
 * @module @stackra/config/nestjs/services
 * @description Discovers @SecretsDriver() decorated providers and registers
 *   them for use as 'secrets' driver sources.
 *   Uses DISCOVERY_SERVICE token for platform-agnostic provider scanning.
 */

import { IInjectable, Inject, Optional } from '@nestjs/common';
import type { IOnModuleInit } from '@nestjs/common';
import { getMetadata } from '@vivtel/metadata';

import { DISCOVERY_SERVICE, type IDiscoveryService, type ISecretsDriver } from '@stackra/contracts';

// ════════════════════════════════════════════════════════════════════════════════
// Metadata
// ════════════════════════════════════════════════════════════════════════════════

/** Metadata key for @SecretsDriver() decorated providers. */
export const SECRETS_DRIVER_METADATA_KEY = 'stackra:config:secrets-driver';

// ════════════════════════════════════════════════════════════════════════════════
// Service
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Secrets driver loader.
 *
 * Discovers all classes decorated with `@SecretsDriver(name)` and registers
 * them so they can be used as config sources with `driver: 'secrets'`.
 *
 * Uses the platform-agnostic `IDiscoveryService` (from `@stackra/contracts`)
 * to scan providers. Works with both `@stackra/ts-container` and NestJS.
 */
@IInjectable()
export class SecretsDriverLoader implements IOnModuleInit {
  /** Registered secrets drivers keyed by name. */
  private readonly drivers: Map<string, ISecretsDriver> = new Map();

  /**
   * @param discovery - Platform-agnostic discovery service for scanning providers
   */
  public constructor(
    @Optional()
    @Inject(DISCOVERY_SERVICE)
    private readonly discovery?: IDiscoveryService
  ) {}

  /**
   * Scan for @SecretsDriver() providers and register them.
   */
  public onModuleInit(): void {
    if (!this.discovery) return;

    const providers = this.discovery.getProviders();

    for (const { instance, metatype } of providers) {
      if (!instance || !metatype) continue;

      const driverName = getMetadata<string>(SECRETS_DRIVER_METADATA_KEY, metatype);
      if (!driverName) continue;

      this.drivers.set(driverName, instance as ISecretsDriver);
    }
  }

  /**
   * Get a registered secrets driver by name.
   *
   * @param name - The driver name
   * @returns The secrets driver instance or undefined
   */
  public getDriver(name: string): ISecretsDriver | undefined {
    return this.drivers.get(name);
  }

  /**
   * Get all registered driver names.
   *
   * @returns Array of registered driver names
   */
  public getDriverNames(): string[] {
    return Array.from(this.drivers.keys());
  }
}
