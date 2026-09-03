/**
 * @file redis-manager.service.ts
 * @module @stackra/ts-redis/manager
 * @description Multi-client Redis manager. Extends `MultipleInstanceManager`
 *   to resolve named clients by their configured driver discriminator.
 *   Handles lifecycle (warm-up, disconnect), reconnection with exponential
 *   backoff, and health checks.
 */

import {
  IInjectable,
  Inject,
  Optional,
  type IOnModuleInit,
  type IOnModuleDestroy,
} from '@stackra/ts-container';
import { MultipleInstanceManager } from '@stackra/ts-support';
import { Logger } from '@stackra/logger';

import type {
  IEventEmitter,
  IRedisClient,
  IRedisManager,
  IRedisModuleOptions,
} from '@stackra/contracts';
import { REDIS_CONFIG, REDIS_EVENTS, EVENT_EMITTER } from '@stackra/contracts';

import {
  DEFAULT_MAX_RETRIES,
  DEFAULT_RETRY_DELAY_MS,
  DEFAULT_BACKOFF_MULTIPLIER,
} from '../constants';

/**
 * Redis manager — the single entry point for Redis access.
 *
 * Orchestrates multiple named clients, dispatches each to the
 * appropriate backend factory based on the `driver` discriminator,
 * and provides lifecycle management, health checks, and reconnection.
 */
@IInjectable()
export class RedisManager
  extends MultipleInstanceManager<IRedisClient>
  implements IRedisManager, IOnModuleInit, IOnModuleDestroy
{
  /** Scoped logger. */
  private readonly logger = new Logger(RedisManager.name);

  /**
   * @param config - Redis configuration with named connections.
   * @param eventEmitter - Optional event emitter for lifecycle events.
   */
  public constructor(
    @Inject(REDIS_CONFIG) private readonly config: IRedisModuleOptions,
    @Optional() @Inject(EVENT_EMITTER) private readonly eventEmitter?: IEventEmitter
  ) {
    super();
  }

  // ──────────────────────────────────────────────────────────────────
  // Lifecycle
  // ──────────────────────────────────────────────────────────────────

  /**
   * Eagerly warm the default connection so config errors surface at boot.
   */
  public async onModuleInit(): Promise<void> {
    if (!this.config?.default) {
      this.logger.warn('[RedisManager] Config is missing "default"; skipping warm-up.');
      return;
    }

    if (!this.config.connections[this.config.default]) {
      this.logger.warn(
        `[RedisManager] Default connection "${this.config.default}" not declared; skipping warm-up.`
      );
      return;
    }

    try {
      await this.connection();
    } catch (err: unknown) {
      this.logger.warn(
        `[RedisManager] Failed to warm default connection "${this.config.default}": ${(err as Error).message}`
      );
    }
  }

  /**
   * Disconnect every active client on shutdown to release sockets.
   */
  public async onModuleDestroy(): Promise<void> {
    await this.disconnectAll();
  }

  // ──────────────────────────────────────────────────────────────────
  // MultipleInstanceManager contract
  // ──────────────────────────────────────────────────────────────────

  /** @inheritdoc */
  public getDefaultInstance(): string {
    return this.config.default;
  }

  /** @inheritdoc */
  public setDefaultInstance(name: string): void {
    (this.config as { default: string }).default = name;
  }

  /** @inheritdoc */
  public getInstanceConfig(name: string): Record<string, unknown> | undefined {
    const config = this.config.connections[name];
    if (!config) return undefined;
    return config as unknown as Record<string, unknown>;
  }

  /** @inheritdoc */
  protected createDriver(_driver: string, _config: Record<string, unknown>): IRedisClient {
    throw new Error('RedisManager: connections are async; call connection() instead.');
  }

  /** @inheritdoc */
  protected async createDriverAsync(
    driver: string,
    _config: Record<string, unknown>
  ): Promise<IRedisClient> {
    throw new Error(
      `Redis driver "${driver}" is not registered. Use extend() or forFeature() to register backends.`
    );
  }

  // ──────────────────────────────────────────────────────────────────
  // Public API
  // ──────────────────────────────────────────────────────────────────

  /**
   * Resolve a client by name (or the default client).
   *
   * @param name - Client name from configuration.
   * @returns A live `IRedisClient`.
   */
  public async connection(name?: string): Promise<IRedisClient> {
    return this.instanceAsync(name);
  }

  /**
   * Disconnect a single named client.
   *
   * @param name - Client name from configuration.
   */
  public async disconnect(name?: string): Promise<void> {
    const connectionName = name ?? this.config.default;
    if (!this.hasInstance(connectionName)) return;

    const client = this.instance(connectionName);
    try {
      await client.disconnect();
      this.emit(REDIS_EVENTS.DISCONNECTED, { connection: connectionName, reason: 'manual' });
    } catch (err: unknown) {
      this.emit(REDIS_EVENTS.DISCONNECTED, {
        connection: connectionName,
        reason: (err as Error)?.message ?? 'disconnect-error',
      });
    } finally {
      this.forgetInstance(connectionName);
    }
  }

  /**
   * Disconnect every active client and clear the cache.
   */
  public async disconnectAll(): Promise<void> {
    const names = this.getResolvedInstances();
    await Promise.all(names.map((n) => this.disconnect(n)));
    this.purge();
  }

  /**
   * List configured client names.
   *
   * @returns Array of all connection names from configuration.
   */
  public getConnectionNames(): string[] {
    return Object.keys(this.config.connections);
  }

  /**
   * Read the default client name.
   *
   * @returns The default connection name.
   */
  public getDefaultConnectionName(): string {
    return this.config.default;
  }

  /**
   * Tell whether a client is currently resolved (cached).
   *
   * @param name - Client name to check.
   * @returns `true` if the client is active.
   */
  public isConnectionActive(name?: string): boolean {
    return this.hasInstance(name ?? this.config.default);
  }

  /**
   * Quick health check — issues a PING against the specified client.
   *
   * @param name - Client name (uses default if omitted).
   * @returns `true` when the client round-trips successfully.
   */
  public async healthCheck(name?: string): Promise<boolean> {
    try {
      const client = await this.connection(name);
      const result = await client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  /**
   * Force reconnect a single client with exponential backoff.
   *
   * @param name - Client name (uses default if omitted).
   * @param options - Retry tuning parameters.
   * @returns The reconnected `IRedisClient`.
   * @throws When every retry attempt fails.
   */
  public async reconnect(
    name?: string,
    options?: { maxRetries?: number; delayMs?: number; backoffMultiplier?: number }
  ): Promise<IRedisClient> {
    const connectionName = name ?? this.config.default;
    const maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
    const baseDelay = options?.delayMs ?? DEFAULT_RETRY_DELAY_MS;
    const multiplier = options?.backoffMultiplier ?? DEFAULT_BACKOFF_MULTIPLIER;

    if (this.hasInstance(connectionName)) {
      await this.disconnect(connectionName);
    }

    let lastError: Error | undefined;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      this.emit(REDIS_EVENTS.RECONNECTING, { connection: connectionName, attempt });
      try {
        const client = await this.connection(connectionName);
        this.logger.info(
          `[RedisManager] Reconnected "${connectionName}" on attempt ${attempt + 1}.`
        );
        this.emit(REDIS_EVENTS.CONNECTED, { connection: connectionName, driver: 'reconnect' });
        return client;
      } catch (err: unknown) {
        lastError = err as Error;
        this.logger.warn(
          `[RedisManager] Reconnect ${attempt + 1}/${maxRetries} failed for "${connectionName}": ${lastError.message}`
        );
        this.forgetInstance(connectionName);

        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(multiplier, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    this.emit(REDIS_EVENTS.ERROR, {
      connection: connectionName,
      error: lastError?.message ?? 'unknown',
    });

    throw (
      lastError ??
      new Error(`Failed to reconnect "${connectionName}" after ${maxRetries} attempts.`)
    );
  }

  // ──────────────────────────────────────────────────────────────────
  // Internal — event dispatch
  // ──────────────────────────────────────────────────────────────────

  /**
   * Emit a Redis lifecycle event (fail-open).
   *
   * @param event - Event name from REDIS_EVENTS.
   * @param payload - Event payload.
   */
  private emit(event: string, payload?: unknown): void {
    if (!this.eventEmitter) return;
    try {
      this.eventEmitter.emit(event, payload);
    } catch (error: Error | any) {
      this.logger.warn('[RedisManager] Failed to emit event', { event, error });
    }
  }
}
