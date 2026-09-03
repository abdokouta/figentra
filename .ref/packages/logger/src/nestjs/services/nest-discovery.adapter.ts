/**
 * @file nest-discovery.adapter.ts
 * @module @stackra/logger/nestjs/services
 * @description NestJS-specific discovery adapter using @nestjs/core DiscoveryService.
 *   Scans ALL providers in the NestJS container for @Reporter-decorated classes,
 *   enabling true auto-discovery of custom reporters without manual registration.
 */

import { Injectable } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';

import type {
  IDiscoveryAdapter,
  IDiscoveredProvider,
} from '../../core/interfaces/discovery-adapter.interface';

/**
 * NestJS discovery adapter — uses @nestjs/core DiscoveryService.
 *
 * This adapter scans ALL providers registered in the NestJS DI container,
 * enabling true auto-discovery. Any class decorated with @Reporter('name')
 * and registered as a provider (in any module) will be found and registered
 * with the LoggerManager automatically.
 *
 * This is the key advantage over the core ContainerDiscoveryAdapter:
 * consumers only need to register their custom reporter as a NestJS provider
 * and decorate it with @Reporter — no manual registerReporter() call needed.
 *
 * @example
 * ```typescript
 * // In any NestJS module:
 * @Reporter('datadog')
 * @Injectable()
 * export class DatadogReporter implements ILogReporter {
 *   readonly name = 'datadog';
 *   write(entry: ILogEntry): void { ... }
 * }
 *
 * // Just register as a provider — auto-discovered:
 * @Module({ providers: [DatadogReporter] })
 * export class MonitoringModule {}
 * ```
 */
export @Injectable()
class NestDiscoveryAdapter implements IDiscoveryAdapter {
  /**
   * @param discoveryService - NestJS core DiscoveryService for provider scanning
   */
  public constructor(private readonly discoveryService: DiscoveryService) {}

  /**
   * Scan all NestJS providers and return them as discovered providers.
   *
   * Filters out providers without an instance or metatype (value providers,
   * factory providers without a class, etc.).
   *
   * @returns Array of all class-based providers with live instances
   */
  public getProviders(): IDiscoveredProvider[] {
    const wrappers = this.discoveryService.getProviders();
    const result: IDiscoveredProvider[] = [];

    for (const wrapper of wrappers) {
      const instance = wrapper.instance;
      const metatype = wrapper.metatype ?? null;

      // Skip providers that aren't instantiated yet or lack a class reference
      if (!instance || !metatype) continue;

      result.push({ instance, metatype });
    }

    return result;
  }
}
