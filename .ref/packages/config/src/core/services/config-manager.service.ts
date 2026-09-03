/**
 * @file config-manager.service.ts
 * @module @stackra/config/core/services
 * @description ConfigManager — multi-source configuration orchestrator.
 *   Extends MultipleInstanceManager to provide lazy driver resolution,
 *   cached ConfigService wrappers, async source support, fallback chains,
 *   and lifecycle management.
 */

import { IInjectable, Inject, Optional } from '@stackra/ts-container';
import { MultipleInstanceManager } from '@stackra/ts-support';

import type {
  IConfigDriver,
  IConfigManager,
  IConfigModuleOptions,
  IConfigSourceOptions,
} from '@stackra/contracts';
import { CONFIG_OPTIONS, CONFIG_EVENTS, EVENT_EMITTER } from '@stackra/contracts';
import { EnvDriver } from '../drivers/env.driver';
import { MemoryDriver } from '../drivers/memory.driver';
import { StaticDriver } from '../drivers/static.driver';
import { HttpDriver } from '../drivers/http.driver';
import { ConfigService } from './config.service';
import type { IConfigEventEmitter } from './config.service';
import { ConfigSourceError } from '../errors';

// ════════════════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════════════════

/** Drivers that can be created synchronously. */
const SYNC_DRIVERS = new Set(['env', 'memory', 'static']);

// ════════════════════════════════════════════════════════════════════════════════
// Service
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Config manager — multi-source configuration orchestrator.
 *
 * Extends `MultipleInstanceManager<IConfigDriver>` to manage multiple named
 * configuration sources. Each source is lazily created and cached. Wraps
 * drivers in `ConfigService` instances for typed access.
 *
 * Lifecycle:
 * - `onModuleInit()` — eagerly creates the default source + runs validation
 * - `onModuleDestroy()` — disposes all drivers and clears caches
 *
 * @example
 * ```typescript
 * const manager = app.get(ConfigManager);
 * const config = manager.source(); // default source
 * const dbHost = config.getString('DB_HOST', 'localhost');
 *
 * // Async source (HTTP)
 * const remote = await manager.sourceAsync('api');
 * const featureFlag = remote.getBool('feature.darkMode', false);
 * ```
 */
@IInjectable()
export class ConfigManager
  extends MultipleInstanceManager<IConfigDriver>
  implements IConfigManager
{
  /** Cached ConfigService wrappers keyed by source name. */
  private readonly services: Map<string, ConfigService> = new Map();

  /** Optional event emitter for config lifecycle events. */
  private readonly eventEmitter?: IConfigEventEmitter;

  /**
   * @param config - Config module options injected via DI
   * @param eventManager - Optional event emitter for lifecycle events
   */
  public constructor(
    @Inject(CONFIG_OPTIONS) private readonly config: IConfigModuleOptions,
    @Optional() @Inject(EVENT_EMITTER) eventManager?: IConfigEventEmitter
  ) {
    super();
    this.eventEmitter = eventManager;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Lifecycle
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Called after all providers are instantiated.
   *
   * Eagerly creates the default source to catch config errors early.
   * Runs validation if configured.
   */
  public async onModuleInit(): Promise<void> {
    try {
      const service = await this.sourceAsync();

      // Run validation if configured
      if (this.config.validate) {
        await this.config.validate(service.all());
      }

      this.emitSafe(CONFIG_EVENTS.VALIDATED, {
        source: this.config.default ?? 'env',
        keys: Object.keys(service.all()).length,
      });
    } catch (err: Error | any) {
      // Fail-soft: log warning but don't crash
      console.warn(
        `[ConfigManager] Failed to initialize default source '${this.config.default ?? 'env'}': ${(err as Error).message}`
      );
    }
  }

  /**
   * Called on app shutdown. Clears all caches and disposes drivers.
   */
  public onModuleDestroy(): void {
    for (const [, service] of this.services) {
      // Dispose underlying driver if it supports it
      const driver = (service as any).driver as IConfigDriver;
      if (driver?.dispose) {
        driver.dispose();
      }
    }
    this.services.clear();
    this.purge();
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // MultipleInstanceManager Contract
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Get the default source name from configuration.
   *
   * @returns The default source name
   */
  public getDefaultInstance(): string {
    return this.config.default ?? 'env';
  }

  /**
   * Set the default source at runtime.
   *
   * @param name - New default source name
   */
  public setDefaultInstance(name: string): void {
    (this.config as any).default = name;
  }

  /**
   * Get configuration for a named source.
   *
   * @param name - Source name
   * @returns The source configuration object or null
   */
  public getInstanceConfig(name: string): Record<string, unknown> | null {
    const sources = this.config.sources ?? {};
    return sources[name] ? (sources[name] as unknown as Record<string, unknown>) : null;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Driver Factories
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Create a driver synchronously.
   *
   * @param driver - Driver name
   * @param config - Source configuration
   * @returns An IConfigDriver instance
   */
  protected createEnvDriver(config: Record<string, unknown>): IConfigDriver {
    const sourceConfig = config as unknown as IConfigSourceOptions;
    const envDriver = new EnvDriver({
      expandVariables: sourceConfig.expandVariables as boolean | undefined,
      envPrefix: sourceConfig.envPrefix as string | false | undefined,
      globalName: sourceConfig.globalName as string | undefined,
    });
    envDriver.load();

    // Merge load config if provided
    if (sourceConfig.load && typeof sourceConfig.load === 'object') {
      envDriver.merge(sourceConfig.load as Record<string, unknown>);
    }

    return envDriver as unknown as IConfigDriver;
  }

  /**
   * Create a MemoryDriver instance.
   *
   * @param config - Source configuration with optional initial data
   * @returns A MemoryDriver instance
   */
  protected createMemoryDriver(config: Record<string, unknown>): IConfigDriver {
    const sourceConfig = config as unknown as IConfigSourceOptions;
    const initialData = sourceConfig.config ?? {};
    return new MemoryDriver(initialData);
  }

  /**
   * Create a StaticDriver instance.
   *
   * @param config - Source configuration with config object
   * @returns A StaticDriver instance
   */
  protected createStaticDriver(config: Record<string, unknown>): IConfigDriver {
    const sourceConfig = config as unknown as IConfigSourceOptions;
    const staticData = sourceConfig.config ?? {};
    return new StaticDriver(staticData);
  }

  /**
   * Create an HttpDriver instance (async).
   *
   * @param config - Source configuration with HTTP options
   * @returns A promise resolving to an HttpDriver instance
   */
  protected async createHttpDriverAsync(config: Record<string, unknown>): Promise<IConfigDriver> {
    const sourceConfig = config as unknown as IConfigSourceOptions;

    if (!sourceConfig.url) {
      throw new ConfigSourceError('HTTP source requires a "url" option.');
    }

    const httpDriver = new HttpDriver({
      url: sourceConfig.url,
      headers: sourceConfig.headers,
      query: sourceConfig.query,
      refreshInterval: sourceConfig.refreshInterval,
    });

    await httpDriver.load();

    // Merge load config if provided
    if (sourceConfig.load && typeof sourceConfig.load === 'object') {
      httpDriver.merge(sourceConfig.load as Record<string, unknown>);
    }

    return httpDriver;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Public API — Source Access
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Get a ConfigService for a named source (synchronous).
   *
   * Only works for sync drivers (env, memory, static).
   * For async drivers (http), use `sourceAsync()`.
   *
   * @param name - Source name (uses default if omitted)
   * @returns ConfigService instance
   */
  public source(name?: string): ConfigService {
    const sourceName = name ?? this.config.default ?? 'env';

    const existing = this.services.get(sourceName);
    if (existing) return existing;

    const driver = this.createDriverByName(sourceName);
    const service = this.wrapDriver(driver, sourceName);

    this.services.set(sourceName, service);
    this.emitLoaded(sourceName, service);

    return service;
  }

  /**
   * Get a ConfigService for a named source (asynchronous).
   *
   * Supports all driver types including async ones (HTTP, file, secrets).
   *
   * @param name - Source name (uses default if omitted)
   * @returns Promise resolving to ConfigService
   */
  public async sourceAsync(name?: string): Promise<ConfigService> {
    const sourceName = name ?? this.config.default ?? 'env';

    const existing = this.services.get(sourceName);
    if (existing) return existing;

    try {
      const driver = await this.createDriverByNameAsync(sourceName);
      const service = this.wrapDriver(driver, sourceName);

      this.services.set(sourceName, service);
      this.emitLoaded(sourceName, service);

      return service;
    } catch (error: Error | any) {
      // Try fallback if configured
      const sourceConfig = this.getSourceConfig(sourceName);
      if (sourceConfig?.fallback) {
        this.emitSafe(CONFIG_EVENTS.FALLBACK_ACTIVATED, {
          failed: sourceName,
          fallback: sourceConfig.fallback,
          error: (error as Error).message,
        });

        return this.sourceAsync(sourceConfig.fallback);
      }
      throw error;
    }
  }

  /**
   * Force re-load of a source (or all sources).
   *
   * @param sourceName - Source to refresh (all if omitted)
   */
  public async refresh(sourceName?: string): Promise<void> {
    if (sourceName) {
      const service = this.services.get(sourceName);
      if (service) {
        const driver = (service as any).driver as IConfigDriver;
        if (driver.refresh) {
          await driver.refresh();
        }
      }
    } else {
      for (const [, service] of this.services) {
        const driver = (service as any).driver as IConfigDriver;
        if (driver.refresh) {
          await driver.refresh();
        }
      }
    }
  }

  /**
   * Clear cached config for a source (or all).
   *
   * @param sourceName - Source to clear (all if omitted)
   */
  public clearCache(sourceName?: string): void {
    if (sourceName) {
      this.services.delete(sourceName);
      this.forgetInstance(sourceName);
    } else {
      this.services.clear();
      this.purge();
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Introspection
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Get the default source name.
   *
   * @returns The default source name
   */
  public getDefaultSource(): string {
    return this.config.default ?? 'env';
  }

  /**
   * Get all configured source names.
   *
   * @returns Array of source names
   */
  public getSourceNames(): string[] {
    return Object.keys(this.config.sources ?? {});
  }

  /**
   * Check if a source is configured.
   *
   * @param name - Source name to check
   * @returns True if the source exists in configuration
   */
  public hasSource(name: string): boolean {
    return name in (this.config.sources ?? {});
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Source Management
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Forget a cached source and its ConfigService wrapper.
   *
   * @param name - Source name(s). Uses default if omitted.
   * @returns This for chaining
   */
  public forgetSource(name?: string | string[]): this {
    const names = name ? (Array.isArray(name) ? name : [name]) : [this.config.default ?? 'env'];

    for (const n of names) {
      this.services.delete(n);
    }
    return this.forgetInstance(name);
  }

  /**
   * Clear all cached sources and ConfigService wrappers.
   *
   * @param name - Optional name (passed to super)
   */
  public override purge(name?: string): void {
    this.services.clear();
    super.purge(name);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private Helpers
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Get source configuration by name.
   */
  private getSourceConfig(name: string): IConfigSourceOptions | undefined {
    return (this.config.sources ?? {})[name];
  }

  /**
   * Create a driver synchronously by source name.
   */
  private createDriverByName(sourceName: string): IConfigDriver {
    const sourceConfig = this.getSourceConfig(sourceName);
    if (!sourceConfig) {
      throw new ConfigSourceError(`Config source "${sourceName}" is not configured.`);
    }

    const driverName = sourceConfig.driver;

    if (!SYNC_DRIVERS.has(driverName)) {
      throw new ConfigSourceError(
        `Config driver "${driverName}" requires async initialization. Use sourceAsync() instead.`
      );
    }

    switch (driverName) {
      case 'env':
        return this.createEnvDriver(sourceConfig as unknown as Record<string, unknown>);
      case 'memory':
        return this.createMemoryDriver(sourceConfig as unknown as Record<string, unknown>);
      case 'static':
        return this.createStaticDriver(sourceConfig as unknown as Record<string, unknown>);
      default:
        throw new ConfigSourceError(`Config driver "${driverName}" is not supported.`);
    }
  }

  /**
   * Create a driver asynchronously by source name.
   */
  private async createDriverByNameAsync(sourceName: string): Promise<IConfigDriver> {
    const sourceConfig = this.getSourceConfig(sourceName);
    if (!sourceConfig) {
      throw new ConfigSourceError(`Config source "${sourceName}" is not configured.`);
    }

    const driverName = sourceConfig.driver;

    switch (driverName) {
      case 'env':
        return this.createEnvDriver(sourceConfig as unknown as Record<string, unknown>);
      case 'memory':
        return this.createMemoryDriver(sourceConfig as unknown as Record<string, unknown>);
      case 'static':
        return this.createStaticDriver(sourceConfig as unknown as Record<string, unknown>);
      case 'http':
        return this.createHttpDriverAsync(sourceConfig as unknown as Record<string, unknown>);
      default:
        throw new ConfigSourceError(`Config driver "${driverName}" is not supported.`);
    }
  }

  /**
   * Wrap a driver in a ConfigService.
   */
  private wrapDriver(driver: IConfigDriver, sourceName: string): ConfigService {
    return new ConfigService(driver, this.config.sensitiveKeys, sourceName, {
      encryptionKey: this.config.encryptionKey,
      eventEmitter: this.eventEmitter,
    });
  }

  /**
   * Emit a config.loaded event safely.
   */
  private emitLoaded(sourceName: string, service: ConfigService): void {
    this.emitSafe(CONFIG_EVENTS.LOADED, {
      source: sourceName,
      keys: Object.keys(service.all()).length,
    });
  }

  /**
   * Safely emit an event, catching and swallowing errors.
   */
  private emitSafe(event: string, data: unknown): void {
    if (!this.eventEmitter) return;
    try {
      this.eventEmitter.emit(event, data);
    } catch {
      // Fail-soft
    }
  }
}
