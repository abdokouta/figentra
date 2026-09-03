/**
 * @file stream-producer.service.ts
 * @module @stackra/nestjs-redis/streams
 * @description Redis Streams producer. Appends messages to streams via XADD
 *   with optional MAXLEN trimming and batch support.
 */

import { IInjectable, Inject } from '@nestjs/common';
import { Logger } from '@stackra/logger';

import type { IRedisClient, IRedisManager, IStreamProducer } from '@stackra/contracts';
import { REDIS_MANAGER } from '@stackra/contracts';

import type { IStreamProducerOptions } from './interfaces';

/**
 * Redis Streams producer service.
 *
 * Appends messages to streams via XADD. Supports optional MAXLEN
 * trimming to prevent unbounded stream growth and batch operations
 * via pipeline.
 */
@IInjectable()
export class StreamProducerService implements IStreamProducer {
  /** Scoped logger. */
  private readonly logger = new Logger(StreamProducerService.name);

  /** Default options. */
  private readonly options: IStreamProducerOptions;

  /**
   * @param manager - Redis manager for client access.
   */
  public constructor(@Inject(REDIS_MANAGER) private readonly manager: IRedisManager) {
    this.options = {};
  }

  /**
   * Add a message to a stream.
   *
   * @param stream - The stream name.
   * @param fields - The message fields (key-value pairs).
   * @param maxLen - Optional maximum stream length (MAXLEN ~).
   * @returns The generated message ID.
   */
  public async add(
    stream: string,
    fields: Record<string, string>,
    maxLen?: number
  ): Promise<string> {
    const client = await this.getClient();
    const trimLen = maxLen ?? this.options.maxLen;

    // Build XADD command args
    const args: (string | number)[] = [];

    if (trimLen) {
      args.push('MAXLEN', '~', trimLen);
    }

    args.push('*'); // Auto-generate ID

    for (const [key, value] of Object.entries(fields)) {
      args.push(key, value);
    }

    const result = await client.eval(
      `return redis.call('XADD', KEYS[1], ${args.map((_, i) => `ARGV[${i + 1}]`).join(', ')})`,
      [stream],
      args
    );

    const messageId = String(result);
    this.logger.info(`[StreamProducer] Added message ${messageId} to stream "${stream}".`);
    return messageId;
  }

  /**
   * Add multiple messages to a stream in a pipeline.
   *
   * @param stream - The stream name.
   * @param messages - Array of field maps.
   * @returns Array of generated message IDs.
   */
  public async addBatch(stream: string, messages: Record<string, string>[]): Promise<string[]> {
    if (messages.length === 0) return [];

    const client = await this.getClient();
    const ids: string[] = [];

    // Execute each XADD sequentially (pipeline doesn't support XADD natively in all drivers)
    for (const fields of messages) {
      const args: (string | number)[] = ['*'];
      for (const [key, value] of Object.entries(fields)) {
        args.push(key, value);
      }

      const result = await client.eval(
        `return redis.call('XADD', KEYS[1], ${args.map((_, i) => `ARGV[${i + 1}]`).join(', ')})`,
        [stream],
        args
      );

      ids.push(String(result));
    }

    this.logger.info(`[StreamProducer] Added ${ids.length} messages to stream "${stream}".`);
    return ids;
  }

  /**
   * Get the Redis client for stream operations.
   *
   * @returns The resolved Redis client.
   */
  private async getClient(): Promise<IRedisClient> {
    return this.manager.connection(this.options.connection);
  }
}
