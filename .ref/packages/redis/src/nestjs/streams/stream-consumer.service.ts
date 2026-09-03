/**
 * @file stream-consumer.service.ts
 * @module @stackra/nestjs-redis/streams
 * @description Redis Streams consumer. Reads messages from consumer groups
 *   via XREADGROUP and acknowledges them via XACK after processing.
 */

import { IInjectable, Inject, Optional } from '@nestjs/common';
import { Logger } from '@stackra/logger';

import type {
  IEventEmitter,
  IRedisManager,
  IStreamConsumer,
  IStreamMessage,
} from '@stackra/contracts';
import { REDIS_MANAGER, REDIS_EVENTS, EVENT_EMITTER } from '@stackra/contracts';

import type { IStreamConsumerLoopOptions } from './interfaces';

/**
 * Redis Streams consumer service.
 *
 * Reads messages from a consumer group via XREADGROUP and provides
 * acknowledgment via XACK. Supports configurable batch size, block
 * timeout, and consumer naming.
 */
@IInjectable()
export class StreamConsumerService implements IStreamConsumer {
  /** Scoped logger. */
  private readonly logger = new Logger(StreamConsumerService.name);

  /**
   * @param manager - Redis manager for client access.
   * @param eventEmitter - Optional event emitter for stream events.
   */
  public constructor(
    @Inject(REDIS_MANAGER) private readonly manager: IRedisManager,
    @Optional() @Inject(EVENT_EMITTER) private readonly eventEmitter?: IEventEmitter
  ) {}

  /**
   * Read pending messages from a consumer group.
   *
   * @param stream - The stream name.
   * @param group - The consumer group name.
   * @param options - Consumer configuration.
   * @returns Array of stream messages.
   */
  public async read(
    stream: string,
    group: string,
    options?: IStreamConsumerLoopOptions
  ): Promise<IStreamMessage[]> {
    const client = await this.manager.connection(options?.connection);
    const batchSize = options?.batchSize ?? 10;
    const blockMs = options?.blockMs ?? 5000;
    const consumerName = options?.consumerName ?? `consumer-${Date.now()}`;
    const startId = options?.startId ?? '>';

    // XREADGROUP GROUP group consumer COUNT batchSize BLOCK blockMs STREAMS stream startId
    const script = `
      return redis.call('XREADGROUP', 'GROUP', ARGV[1], ARGV[2], 'COUNT', ARGV[3], 'BLOCK', ARGV[4], 'STREAMS', KEYS[1], ARGV[5])
    `;

    const result = await client.eval(
      script,
      [stream],
      [group, consumerName, batchSize, blockMs, startId]
    );

    if (!result || !Array.isArray(result)) return [];

    const messages: IStreamMessage[] = [];

    // Parse XREADGROUP response: [[streamName, [[id, [field, value, ...]], ...]]]
    for (const streamResult of result as any[]) {
      if (!Array.isArray(streamResult) || streamResult.length < 2) continue;

      const entries = streamResult[1] as any[];
      if (!Array.isArray(entries)) continue;

      for (const entry of entries) {
        if (!Array.isArray(entry) || entry.length < 2) continue;

        const id = String(entry[0]);
        const fieldValues = entry[1] as string[];
        const fields: Record<string, string> = {};

        for (let i = 0; i < fieldValues.length; i += 2) {
          fields[fieldValues[i]!] = fieldValues[i + 1]!;
        }

        const message: IStreamMessage = {
          id,
          stream,
          fields,
          ack: async () => {
            await this.ack(stream, group, [id]);
          },
        };

        messages.push(message);

        this.emit(REDIS_EVENTS.STREAM_MESSAGE_RECEIVED, {
          stream,
          group,
          consumer: consumerName,
          id,
        });
      }
    }

    return messages;
  }

  /**
   * Acknowledge one or more messages.
   *
   * @param stream - The stream name.
   * @param group - The consumer group name.
   * @param ids - Message IDs to acknowledge.
   * @returns Count of messages acknowledged.
   */
  public async ack(stream: string, group: string, ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;

    const client = await this.manager.connection();
    const args = [group, ...ids];

    const result = await client.eval(
      `return redis.call('XACK', KEYS[1], ${args.map((_, i) => `ARGV[${i + 1}]`).join(', ')})`,
      [stream],
      args
    );

    const count = Number(result) || 0;

    for (const id of ids) {
      this.emit(REDIS_EVENTS.STREAM_MESSAGE_ACKNOWLEDGED, { stream, group, id });
    }

    return count;
  }

  /**
   * Create a consumer group for a stream.
   *
   * @param stream - The stream name.
   * @param group - The consumer group name.
   * @param startId - ID to start reading from. Default: "$" (new messages).
   * @returns `true` if created, `false` if already exists.
   */
  public async createGroup(stream: string, group: string, startId?: string): Promise<boolean> {
    const client = await this.manager.connection();
    const id = startId ?? '$';

    try {
      // XGROUP CREATE stream group id MKSTREAM
      await client.eval(
        `return redis.call('XGROUP', 'CREATE', KEYS[1], ARGV[1], ARGV[2], 'MKSTREAM')`,
        [stream],
        [group, id]
      );
      this.logger.info(`[StreamConsumer] Created group "${group}" on stream "${stream}".`);
      return true;
    } catch (error: unknown) {
      const message = (error as Error)?.message ?? '';
      if (message.includes('BUSYGROUP')) {
        // Group already exists — not an error
        return false;
      }
      throw error;
    }
  }

  /**
   * Destroy a consumer group.
   *
   * @param stream - The stream name.
   * @param group - The consumer group name.
   * @returns `true` if destroyed.
   */
  public async destroyGroup(stream: string, group: string): Promise<boolean> {
    const client = await this.manager.connection();

    const result = await client.eval(
      `return redis.call('XGROUP', 'DESTROY', KEYS[1], ARGV[1])`,
      [stream],
      [group]
    );

    return Number(result) === 1;
  }

  /**
   * Emit a stream event (fail-open).
   *
   * @param event - Event name.
   * @param payload - Event payload.
   */
  private emit(event: string, payload: unknown): void {
    if (!this.eventEmitter) return;
    try {
      this.eventEmitter.emit(event, payload);
    } catch {
      // Fail-open
    }
  }
}
