/**
 * @file stream-manager.service.ts
 * @module @stackra/nestjs-redis/streams
 * @description Redis Streams manager. Manages consumer group lifecycle,
 *   runs consumer loops for @StreamProcessor decorated classes, and
 *   handles graceful shutdown.
 */

import { IInjectable, Inject, type IOnModuleDestroy } from '@nestjs/common';
import { Logger } from '@stackra/logger';

import type { IRedisManager, IStreamMessage } from '@stackra/contracts';
import { REDIS_MANAGER } from '@stackra/contracts';

import { StreamConsumerService } from './stream-consumer.service';
import type { IStreamConsumerLoopOptions, IStreamProcessorMetadata } from './interfaces';

/**
 * Handler function for processing stream messages.
 */
type StreamMessageHandler = (message: IStreamMessage) => Promise<void>;

/**
 * Active consumer loop state.
 */
interface IActiveConsumer {
  /** The stream name. */
  stream: string;
  /** The consumer group. */
  group: string;
  /** Whether the loop is running. */
  running: boolean;
  /** Abort signal for graceful shutdown. */
  abort: () => void;
}

/**
 * Redis Streams manager.
 *
 * Orchestrates consumer group lifecycle, runs background consumer loops
 * for registered stream processors, and handles graceful shutdown by
 * stopping all loops and acknowledging pending messages.
 */
@IInjectable()
export class StreamManager implements IOnModuleDestroy {
  /** Scoped logger. */
  private readonly logger = new Logger(StreamManager.name);

  /** Active consumer loops. */
  private readonly consumers: IActiveConsumer[] = [];

  /**
   * @param manager - Redis manager for client access.
   * @param consumer - Stream consumer service for read/ack operations.
   */
  public constructor(
    @Inject(REDIS_MANAGER) _manager: IRedisManager,
    private readonly consumer: StreamConsumerService
  ) {}

  /**
   * Register and start a consumer loop for a stream processor.
   *
   * Creates the consumer group if it doesn't exist, then starts a
   * background loop that reads messages and dispatches them to the handler.
   *
   * @param metadata - Stream processor metadata from the decorator.
   * @param handler - The message processing function.
   */
  public async registerProcessor(
    metadata: IStreamProcessorMetadata,
    handler: StreamMessageHandler
  ): Promise<void> {
    const { stream, group, options } = metadata;

    // Ensure the consumer group exists
    await this.consumer.createGroup(stream, group);

    // Start the consumer loop
    let running = true;
    const activeConsumer: IActiveConsumer = {
      stream,
      group,
      running: true,
      abort: () => {
        running = false;
      },
    };
    this.consumers.push(activeConsumer);

    this.logger.info(`[StreamManager] Starting consumer loop for "${stream}" group "${group}".`);

    // Run the loop in the background (non-blocking)
    void this.runLoop(stream, group, options ?? {}, handler, () => running).then(() => {
      activeConsumer.running = false;
    });
  }

  /**
   * Gracefully stop all consumer loops on module destroy.
   */
  public async onModuleDestroy(): Promise<void> {
    this.logger.info(`[StreamManager] Shutting down ${this.consumers.length} consumer loop(s).`);

    for (const consumer of this.consumers) {
      consumer.abort();
    }

    // Wait briefly for loops to exit
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Run a consumer loop that reads and processes messages.
   *
   * @param stream - The stream name.
   * @param group - The consumer group.
   * @param options - Consumer loop options.
   * @param handler - Message processing function.
   * @param isRunning - Function that returns false to stop the loop.
   */
  private async runLoop(
    stream: string,
    group: string,
    options: IStreamConsumerLoopOptions,
    handler: StreamMessageHandler,
    isRunning: () => boolean
  ): Promise<void> {
    while (isRunning()) {
      try {
        const messages = await this.consumer.read(stream, group, options);

        for (const message of messages) {
          if (!isRunning()) break;

          try {
            await handler(message);
            await message.ack();
          } catch (error: unknown) {
            // Message processing failed — leave unacknowledged for redelivery
            this.logger.warn(
              `[StreamManager] Failed to process message ${message.id} on "${stream}": ${(error as Error).message}`
            );
          }
        }
      } catch (error: unknown) {
        if (!isRunning()) break;

        this.logger.warn(
          `[StreamManager] Consumer loop error on "${stream}/${group}": ${(error as Error).message}`
        );

        // Back off on errors to prevent tight error loops
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
}
