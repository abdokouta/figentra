/**
 * @file redis-event-transport.ts
 * @module @stackra/ts-redis/transport
 * @description Redis-backed event transport for cross-process event distribution.
 *   Implements `IEventTransport` from `@stackra/ts-events` — when connected,
 *   it subscribes to Redis pub/sub and re-emits received events locally.
 *   Local events marked for broadcast are published to Redis for other instances.
 *
 *   This replaces the standalone `@stackra/nestjs-pubsub` package.
 */

import { IInjectable, Inject, Optional } from '@stackra/ts-container';
import { EventTransport } from '@stackra/ts-events';
import type { IEventTransport, IEventEmitterLike } from '@stackra/ts-events';
import { REDIS_MANAGER } from '@stackra/contracts';
import type { IRedisManager } from '@stackra/contracts';
import { Logger } from '@stackra/ts-logger';

/** DI token for transport config. */
export const REDIS_TRANSPORT_CONFIG = Symbol.for('REDIS_EVENT_TRANSPORT_CONFIG');

/**
 * Redis event transport — bridges local EventEmitter ↔ Redis pub/sub.
 *
 * When connected:
 * - **Inbound**: Subscribes to Redis channels matching configured patterns.
 *   When a message arrives from another process, it re-emits locally.
 * - **Outbound**: When a local event is emitted, it publishes to Redis
 *   so other processes receive it.
 *
 * This enables multi-instance event distribution without a separate PubSub package.
 *
 * @example
 * ```typescript
 * // Registration via EventEmitterModule config:
 * EventEmitterModule.forRoot({
 *   transports: [RedisEventTransport],
 * })
 *
 * // Or via forFeature:
 * RedisModule.forFeature('event-transport', RedisEventTransport)
 * ```
 */
@EventTransport({ name: 'redis' })
@IInjectable()
export class RedisEventTransport implements IEventTransport {
  private readonly logger = new Logger('RedisEventTransport');
  private emitter: IEventEmitterLike | null = null;
  private subscriber: any = null;
  private publisher: any = null;
  private readonly prefix: string;
  private readonly patterns: string[];
  private readonly exclude: Set<string>;
  private connected = false;

  constructor(
    @Optional() @Inject(REDIS_MANAGER) private readonly redisManager?: IRedisManager,
    @Optional() @Inject(REDIS_TRANSPORT_CONFIG) private readonly config?: IRedisEventTransportConfig
  ) {
    this.prefix = config?.prefix ?? 'events:';
    this.patterns = config?.patterns ?? ['*'];
    this.exclude = new Set(config?.exclude ?? []);
  }

  /**
   * Connect the transport to the local event emitter.
   * Subscribes to Redis pub/sub and starts forwarding events.
   *
   * @param emitter - The application's EventEmitter
   */
  public async connect(emitter: IEventEmitterLike): Promise<void> {
    if (!this.redisManager) {
      this.logger.warn('RedisEventTransport: No RedisManager available — transport disabled.');
      return;
    }

    this.emitter = emitter;

    try {
      const connectionName = this.config?.connection ?? 'default';
      const client = await (this.redisManager as any).connection(connectionName);

      // Create separate connections for pub and sub (Redis requires this)
      this.subscriber = client.duplicate();
      this.publisher = client;

      // Subscribe to patterns
      for (const pattern of this.patterns) {
        const channel = `${this.prefix}${pattern}`;
        await this.subscriber.psubscribe(channel);
      }

      // Handle incoming messages from other processes
      this.subscriber.on('pmessage', (_pattern: string, channel: string, message: string) => {
        const eventName = channel.replace(this.prefix, '');

        // Don't re-emit events we published ourselves (prevent loops)
        try {
          const parsed = JSON.parse(message);
          if (parsed.__source === process.pid) return;

          // Re-emit locally
          this.emitter?.emit(eventName, parsed.data);
        } catch {
          // Invalid message format — skip
        }
      });

      this.connected = true;
      this.logger.info(
        `RedisEventTransport connected (prefix: "${this.prefix}", patterns: [${this.patterns.join(', ')}])`
      );
    } catch (error: any) {
      this.logger.warn(
        `RedisEventTransport failed to connect: ${error?.message}. Events will be local-only.`
      );
    }
  }

  /**
   * Disconnect from Redis pub/sub.
   */
  public async disconnect(): Promise<void> {
    if (this.subscriber) {
      try {
        await this.subscriber.punsubscribe();
        await this.subscriber.quit();
      } catch {
        /* silent */
      }
    }
    this.connected = false;
    this.emitter = null;
    this.logger.info('RedisEventTransport disconnected.');
  }

  /**
   * Broadcast a local event to Redis for other processes.
   * Called by the EventEmitter when an event is emitted locally.
   *
   * @param event - Event name
   * @param data - Event payload
   */
  public async broadcast(event: string, data: unknown): Promise<void> {
    if (!this.connected || !this.publisher) return;
    if (this.exclude.has(event)) return;

    try {
      const channel = `${this.prefix}${event}`;
      const message = JSON.stringify({ data, __source: process.pid });
      await this.publisher.publish(channel, message);
    } catch {
      // Fail-open — broadcast failure should never break local event flow
    }
  }

  /**
   * Check if the transport is connected.
   */
  public isConnected(): boolean {
    return this.connected;
  }
}
