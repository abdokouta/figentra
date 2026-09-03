/**
 * @file ioredis.backend.ts
 * @module @stackra/ts-redis/backends/ioredis
 * @description Ioredis TCP backend implementation. Creates Redis clients
 *   backed by the ioredis library. Supports standalone, sentinel, and
 *   cluster topologies. Server-only — uses Node's net/tls modules.
 */

import IORedis, { Cluster } from 'ioredis';
import type { Redis as IORedisClient, RedisOptions, ClusterOptions } from 'ioredis';
import { IInjectable } from '@stackra/ts-container';

import type {
  IRedisBackend,
  IRedisClient,
  IIoredisClusterConfig,
  IIoredisSentinelConfig,
  IIoredisStandaloneConfig,
  RedisClientConfig,
} from '@stackra/contracts';

import { RedisConfigError } from '../../errors';
import { IoredisClient } from './ioredis.client';

/**
 * Default backoff — exponential up to 2 seconds.
 *
 * @param times - 0-based reconnect attempt index.
 * @returns Milliseconds to wait before the next attempt.
 */
const defaultRetryStrategy = (times: number): number => Math.min(50 * 2 ** times, 2_000);

/**
 * Ioredis TCP backend.
 *
 * Implements `IRedisBackend` and is registered with `RedisManager`
 * under the `"ioredis"` driver key. Picks between standalone, sentinel,
 * and cluster constructors based on the config's `mode` discriminator.
 */
@IInjectable()
export class IoredisBackend implements IRedisBackend {
  /**
   * Create a Redis client from ioredis configuration.
   *
   * @param config - Client configuration. Must have `driver: 'ioredis'`.
   * @returns A live, ready-to-use Redis client.
   * @throws {RedisConfigError} When config has wrong driver or missing fields.
   */
  public async connect(config: RedisClientConfig): Promise<IRedisClient> {
    if (config.driver !== 'ioredis') {
      throw new RedisConfigError(
        `IoredisBackend received config for driver "${config.driver}". Expected "ioredis".`
      );
    }

    if (config.mode === 'cluster') {
      return this.connectCluster(config);
    }

    if (config.mode === 'sentinel') {
      return this.connectSentinel(config);
    }

    return this.connectStandalone(config);
  }

  // ──────────────────────────────────────────────────────────────────
  // Mode-specific constructors
  // ──────────────────────────────────────────────────────────────────

  /**
   * Construct a standalone TCP connection.
   *
   * @param config - Standalone configuration.
   * @returns A live IoredisClient.
   */
  private async connectStandalone(config: IIoredisStandaloneConfig): Promise<IRedisClient> {
    const options = this.standaloneOptions(config);
    const client: IORedisClient = config.url
      ? new IORedis(config.url, options)
      : new IORedis(options);

    await this.waitReady(client);

    const factory = (): IORedisClient =>
      config.url ? new IORedis(config.url, options) : new IORedis(options);

    return new IoredisClient(client, config.name ?? 'ioredis', factory);
  }

  /**
   * Construct a sentinel-backed connection.
   *
   * @param config - Sentinel configuration.
   * @returns A live IoredisClient.
   */
  private async connectSentinel(config: IIoredisSentinelConfig): Promise<IRedisClient> {
    const options = this.sentinelOptions(config);
    const client: IORedisClient = new IORedis(options);

    await this.waitReady(client);

    const factory = (): IORedisClient => new IORedis(options);

    return new IoredisClient(client, `sentinel:${config.name}`, factory);
  }

  /**
   * Construct a cluster connection.
   *
   * @param config - Cluster configuration.
   * @returns A live IoredisClient.
   */
  private async connectCluster(config: IIoredisClusterConfig): Promise<IRedisClient> {
    const options = this.clusterOptions(config);
    const client: Cluster = new Cluster(config.nodes, options);

    await this.waitReady(client);

    const factory = (): IORedisClient => {
      const first = config.nodes[0]!;
      return new IORedis({
        host: first.host,
        port: first.port,
        username: config.username,
        password: config.password,
        keyPrefix: config.keyPrefix,
        retryStrategy: config.retry?.backoff ?? defaultRetryStrategy,
        tls: config.tls?.enabled
          ? { servername: config.tls.servername, rejectUnauthorized: config.tls.rejectUnauthorized }
          : undefined,
      });
    };

    return new IoredisClient(
      client as unknown as IORedisClient,
      config.name ?? 'ioredis-cluster',
      factory
    );
  }

  // ──────────────────────────────────────────────────────────────────
  // Option translation
  // ──────────────────────────────────────────────────────────────────

  /**
   * Convert standalone config to ioredis RedisOptions.
   *
   * @param config - Source standalone config.
   * @returns Options accepted by `new IORedis(...)`.
   */
  private standaloneOptions(config: IIoredisStandaloneConfig): RedisOptions {
    return {
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      db: config.db,
      keyPrefix: config.keyPrefix,
      connectionName: config.connectionName,
      connectTimeout: config.connectTimeout,
      commandTimeout: config.commandTimeout,
      retryStrategy: config.retry?.backoff ?? defaultRetryStrategy,
      maxRetriesPerRequest: config.retry?.retries === undefined ? null : config.retry.retries,
      tls: config.tls?.enabled
        ? { servername: config.tls.servername, rejectUnauthorized: config.tls.rejectUnauthorized }
        : undefined,
      lazyConnect: false,
    };
  }

  /**
   * Convert sentinel config to ioredis RedisOptions.
   *
   * @param config - Source sentinel config.
   * @returns Options accepted by `new IORedis(...)`.
   */
  private sentinelOptions(config: IIoredisSentinelConfig): RedisOptions {
    return {
      sentinels: config.sentinels,
      name: config.name,
      password: config.password,
      sentinelPassword: config.sentinelPassword,
      db: config.db,
      keyPrefix: config.keyPrefix,
      retryStrategy: config.retry?.backoff ?? defaultRetryStrategy,
      maxRetriesPerRequest: config.retry?.retries === undefined ? null : config.retry.retries,
      tls: config.tls?.enabled
        ? { servername: config.tls.servername, rejectUnauthorized: config.tls.rejectUnauthorized }
        : undefined,
    };
  }

  /**
   * Convert cluster config to ioredis ClusterOptions.
   *
   * @param config - Source cluster config.
   * @returns Options accepted by `new Cluster(...)`.
   */
  private clusterOptions(config: IIoredisClusterConfig): ClusterOptions {
    const redisOptions: RedisOptions = {
      username: config.username,
      password: config.password,
      keyPrefix: config.keyPrefix,
      tls: config.tls?.enabled
        ? { servername: config.tls.servername, rejectUnauthorized: config.tls.rejectUnauthorized }
        : undefined,
    };

    return {
      redisOptions,
      maxRedirections: config.maxRedirections ?? 16,
      clusterRetryStrategy: config.retry?.backoff ?? defaultRetryStrategy,
    };
  }

  // ──────────────────────────────────────────────────────────────────
  // Readiness
  // ──────────────────────────────────────────────────────────────────

  /**
   * Wait for the client to reach the `ready` state.
   *
   * @param client - Ioredis standalone or cluster client.
   */
  private waitReady(client: IORedisClient | Cluster): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const onReady = (): void => {
        client.off('error', onError);
        resolve();
      };
      const onError = (err: Error): void => {
        client.off('ready', onReady);
        reject(err);
      };
      client.once('ready', onReady);
      client.once('error', onError);
    });
  }
}
