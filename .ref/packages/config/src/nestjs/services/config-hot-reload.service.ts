/**
 * @file config-hot-reload.service.ts
 * @module @stackra/config/nestjs/services
 * @description Redis pub/sub hot-reload service for configuration.
 *   Subscribes to a Redis channel for config change notifications.
 *   When a change is published, invalidates the local cache and reloads
 *   the affected source. Enables config consistency across cluster nodes.
 */

import {
  IInjectable,
  Inject,
  Optional,
  Logger,
  type IOnModuleInit,
  type IOnModuleDestroy,
} from '@nestjs/common';
import { ConfigManager } from '../../core/services/config-manager.service';

// ============================================================================
// Constants
// ============================================================================

/** DI token for the optional Redis client. */
const REDIS_CLIENT = Symbol.for('REDIS_CLIENT');

/** DI token for the config manager. */
const CONFIG_MANAGER = Symbol.for('CONFIG_MANAGER');

/** Redis channel for config change notifications. */
const CONFIG_CHANGED_CHANNEL = 'config:changed';

// ============================================================================
// Interfaces
// ============================================================================

/**
 * Minimal Redis client interface for pub/sub operations.
 * Compatible with ioredis and any Redis client that supports subscribe/publish.
 */
interface IRedisClient {
  /** Subscribe to a channel with a message handler. */
  subscribe(channel: string, callback: (message: string) => void): void;
  /** Publish a message to a channel. */
  publish(channel: string, message: string): Promise<number>;
  /** Unsubscribe from a channel. */
  unsubscribe(channel: string): void;
}

/**
 * Payload structure for config change notifications.
 */
interface IConfigChangePayload {
  /** The config source that changed (e.g., 'env', 'remote'). */
  source: string;
  /** Keys that were affected by the change. */
  keys: string[];
  /** Timestamp of the change (ms since epoch). */
  timestamp: number;
}

// ============================================================================
// Service
// ============================================================================

/**
 * Config hot-reload service — Redis pub/sub for cluster-wide config invalidation.
 *
 * Subscribes to a Redis pub/sub channel for config change notifications.
 * When a config change is published by any node, all subscribing nodes
 * invalidate their local cache and reload the affected source.
 *
 * Fail-open pattern: if Redis is not configured, the service is a no-op.
 * Config changes are still applied locally, just not propagated to other nodes.
 *
 * @example
 * ```typescript
 * // Publishing a config change (e.g., after an admin updates a setting):
 * const hotReload = app.get(ConfigHotReloadService);
 * await hotReload.publishChange('remote', ['feature.darkMode', 'app.name']);
 *
 * // All other nodes in the cluster will automatically refresh their 'remote' source.
 * ```
 */
@IInjectable()
export class ConfigHotReloadService implements IOnModuleInit, IOnModuleDestroy {
  private readonly logger = new Logger(ConfigHotReloadService.name);

  /**
   * @param redis - Optional Redis client for pub/sub operations
   * @param configManager - The config manager to refresh on change notifications
   */
  public constructor(
    @Optional() @Inject(REDIS_CLIENT) private readonly redis?: IRedisClient,
    @Inject(CONFIG_MANAGER) private readonly configManager?: ConfigManager
  ) {}

  /**
   * Subscribe to the config change channel on module initialization.
   * No-op if Redis is not available (fail-open).
   */
  public onModuleInit(): void {
    if (!this.redis) {
      this.logger.debug('Redis not available — config hot-reload disabled');
      return;
    }

    try {
      this.redis.subscribe(CONFIG_CHANGED_CHANNEL, (message: string) => {
        this.handleMessage(message);
      });

      this.logger.debug('Subscribed to config hot-reload channel');
    } catch (error: Error | any) {
      this.logger.warn('Failed to subscribe to config hot-reload channel', String(error));
    }
  }

  /**
   * Unsubscribe from the config change channel on module destruction.
   */
  public onModuleDestroy(): void {
    if (!this.redis) return;

    try {
      this.redis.unsubscribe(CONFIG_CHANGED_CHANNEL);
    } catch {
      // Fail-open on cleanup
    }
  }

  /**
   * Publish a config change notification to all cluster nodes.
   *
   * Other nodes subscribed to the same Redis instance will receive
   * the notification and refresh their local config cache.
   *
   * @param source - The config source that changed
   * @param keys - Array of config keys that were affected
   */
  public async publishChange(source: string, keys: string[]): Promise<void> {
    if (!this.redis) return;

    const payload: IConfigChangePayload = {
      source,
      keys,
      timestamp: Date.now(),
    };

    try {
      await this.redis.publish(CONFIG_CHANGED_CHANNEL, JSON.stringify(payload));
      this.logger.debug(`Published config change notification for source: ${source}`);
    } catch (error: Error | any) {
      this.logger.warn('Failed to publish config change notification', String(error));
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Handle an incoming config change message from Redis.
   *
   * @param message - Raw JSON message from the pub/sub channel
   */
  private handleMessage(message: string): void {
    try {
      const payload = JSON.parse(message) as IConfigChangePayload;
      const { source } = payload;

      this.logger.debug(`Received config change notification for source: ${source}`);

      // Refresh the affected source in the config manager
      if (this.configManager) {
        this.configManager.refresh(source).catch((error) => {
          this.logger.warn(
            `Failed to refresh config source '${source}' after hot-reload: ${(error as Error).message}`
          );
        });
      }
    } catch (error: Error | any) {
      this.logger.warn(`Failed to parse config change message: ${(error as Error).message}`);
    }
  }
}
