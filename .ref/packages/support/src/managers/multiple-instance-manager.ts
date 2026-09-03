/**
 * @file multiple-instance-manager.ts
 * @module @stackra/ts-support/managers
 * @description Abstract base for managers with multiple named instances.
 *
 *   Unlike `Manager` (one default driver), this supports N named connections
 *   each with its own config and driver. Think: Redis (main, cache, session),
 *   Queue (default, emails, notifications), Cache (memory, redis, file).
 *
 *   Inspired by Laravel's `Illuminate\Support\MultipleInstanceManager`.
 *
 *   Use for: CacheManager, QueueManager, RedisManager, DatabaseManager
 *   (services with MULTIPLE named instances, each independently configured).
 *
 * @example
 * ```typescript
 * class CacheManager extends MultipleInstanceManager<ICacheStore> {
 *   protected driverKey = 'driver'; // config key that specifies the driver
 *
 *   public getDefaultInstance(): string {
 *     return this.config.default; // e.g., 'redis'
 *   }
 *
 *   public getInstanceConfig(name: string): Record<string, unknown> {
 *     return this.config.stores[name]; // e.g., { driver: 'redis', host: '...' }
 *   }
 *
 *   protected createRedisDriver(config: Record<string, unknown>): ICacheStore {
 *     return new RedisCacheStore(config);
 *   }
 *
 *   protected createMemoryDriver(config: Record<string, unknown>): ICacheStore {
 *     return new MemoryCacheStore(config);
 *   }
 * }
 * ```
 */

import { Str } from '../str';

/**
 * Abstract MultipleInstanceManager — resolves named instances lazily.
 *
 * @typeParam TInstance - The interface type that all instances implement
 */
export abstract class MultipleInstanceManager<TInstance = unknown> {
  /**
   * Cache of resolved instances by name.
   */
  protected instances: Map<string, TInstance> = new Map();

  /**
   * Registry of custom instance creators.
   */
  protected customCreators: Map<string, InstanceCreator<TInstance>> = new Map();

  /**
   * The config key that identifies which driver to use.
   * Override in subclasses if needed (default: 'driver').
   */
  protected driverKey: string = 'driver';

  // ══════════════════════════════════════════════════════════════════════════
  // Abstract — subclasses must implement
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Get the default instance name.
   *
   * @returns Name of the default instance (e.g., 'redis', 'main', 'default')
   */
  public abstract getDefaultInstance(): string;

  /**
   * Set the default instance name.
   *
   * @param name - New default instance name
   */
  public abstract setDefaultInstance(name: string): void;

  /**
   * Get the configuration for a specific named instance.
   *
   * @param name - Instance name
   * @returns Config object for that instance, or null if not defined
   */
  public abstract getInstanceConfig(name: string): Record<string, unknown> | null;

  // ══════════════════════════════════════════════════════════════════════════
  // Public API
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Get a named instance. Uses the default if none specified.
   * Resolved instances are cached — subsequent calls return the same object.
   *
   * @param name - Instance name (defaults to `getDefaultInstance()`)
   * @returns The resolved instance
   * @throws Error if instance config is not defined or driver is unsupported
   */
  public instance(name?: string): TInstance {
    const instanceName = name ?? this.getDefaultInstance();

    // Return cached if exists
    const cached = this.instances.get(instanceName);
    if (cached) return cached;

    // Resolve and cache
    const resolved = this.resolve(instanceName);
    this.instances.set(instanceName, resolved);
    return resolved;
  }

  /**
   * Register a custom driver creator for instances.
   *
   * @param driverName - Driver name (matched against config's driverKey value)
   * @param creator - Factory function that creates the instance from config
   * @returns this (for chaining)
   *
   * @example
   * ```typescript
   * cacheManager.extend('dynamodb', (config) => new DynamoDBStore(config));
   * ```
   */
  public extend(driverName: string, creator: InstanceCreator<TInstance>): this {
    this.customCreators.set(driverName, creator);
    return this;
  }

  /**
   * Forget (discard) a specific instance from the cache.
   * Next call to `instance(name)` will re-resolve it.
   *
   * @param name - Instance name(s) to forget. Defaults to the default instance.
   * @returns this (for chaining)
   */
  public forgetInstance(name?: string | string[]): this {
    const names = name ? (Array.isArray(name) ? name : [name]) : [this.getDefaultInstance()];

    for (const n of names) {
      this.instances.delete(n);
    }
    return this;
  }

  /**
   * Disconnect and purge a specific instance.
   * Alias for `forgetInstance` — provided for API compatibility.
   *
   * @param name - Instance name to purge
   */
  public purge(name?: string): void {
    this.instances.delete(name ?? this.getDefaultInstance());
  }

  /**
   * Get all resolved instances.
   *
   * @returns Map of instance name → resolved instance
   */
  public getInstances(): Map<string, TInstance> {
    return this.instances;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Protected — resolution logic
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Resolve a named instance from its configuration.
   *
   * @param name - Instance name
   * @returns Resolved instance
   * @throws Error if config is missing or driver is unsupported
   */
  protected resolve(name: string): TInstance {
    const config = this.getInstanceConfig(name);

    if (!config) {
      throw new Error(`Instance [${name}] is not defined.`);
    }

    if (!(this.driverKey in config)) {
      throw new Error(`Instance [${name}] does not specify a ${this.driverKey}.`);
    }

    const driverName = config[this.driverKey] as string;

    // Custom creator takes priority
    const customCreator = this.customCreators.get(driverName);
    if (customCreator) {
      return customCreator(config);
    }

    // Convention-based: create{StudlyDriver}{StudlyDriverKey}()
    // e.g., createRedisDriver(config)
    const method = `create${Str.studly(driverName)}${Str.studly(this.driverKey)}` as keyof this;
    if (typeof this[method] === 'function') {
      return (this[method] as (config: Record<string, unknown>) => TInstance)(config);
    }

    throw new Error(
      `Instance ${this.driverKey} [${driverName}] is not supported by [${this.constructor.name}].`
    );
  }
}
