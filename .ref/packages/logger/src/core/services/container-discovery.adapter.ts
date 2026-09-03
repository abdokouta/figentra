/**
 * @file container-discovery.adapter.ts
 * @module @stackra/logger/core/services
 * @description Discovery adapter for @stackra/ts-container.
 *   Receives reporter instances directly from the module factory and exposes
 *   them as discovered providers. This is simpler than a full runtime scan
 *   because the core module controls its own provider list.
 */

import { Injectable } from '@stackra/ts-container';
import type { ILogReporter } from '@stackra/contracts';

import type {
  IDiscoveryAdapter,
  IDiscoveredProvider,
} from '../interfaces/discovery-adapter.interface';

/**
 * Simple discovery adapter for the core (ts-container) layer.
 *
 * Unlike the NestJS adapter which scans ALL providers at runtime, this adapter
 * receives its reporters explicitly from the module factory. This works because
 * in the core module, we know exactly which reporter classes are registered.
 *
 * Consumers who want to add custom reporters simply register them as providers
 * in their own module — the NestJS adapter handles that case. In the core layer,
 * custom reporters must be passed to the adapter factory.
 */
@Injectable()
export class ContainerDiscoveryAdapter implements IDiscoveryAdapter {
  /** Stored providers for discovery. */
  private readonly providers: IDiscoveredProvider[] = [];

  /**
   * Register a reporter instance for discovery.
   * Called by the module factory after all reporter providers are resolved.
   *
   * @param instance - The reporter instance
   * @param metatype - The class constructor for metadata inspection
   */
  public addProvider(instance: ILogReporter, metatype: Function): void {
    this.providers.push({ instance, metatype });
  }

  /**
   * Return all registered providers for discovery.
   *
   * @returns Array of discovered providers with their instances and metatypes
   */
  public getProviders(): IDiscoveredProvider[] {
    return this.providers;
  }
}
