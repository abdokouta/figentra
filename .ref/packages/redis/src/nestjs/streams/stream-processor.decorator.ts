/**
 * @file stream-processor.decorator.ts
 * @module @stackra/nestjs-redis/streams
 * @description Class decorator that marks a class as a Redis Streams
 *   consumer. The StreamManager auto-discovers decorated classes and
 *   starts consumer loops for them.
 */

import { defineMetadata } from '@vivtel/metadata';

import type { IStreamConsumerLoopOptions, IStreamProcessorMetadata } from './interfaces';

/**
 * Metadata key for stream processor registration.
 */
export const STREAM_PROCESSOR_METADATA_KEY = Symbol.for('STREAM_PROCESSOR_METADATA');

/**
 * Mark a class as a Redis Streams consumer.
 *
 * The decorated class must implement a `process(message: IStreamMessage)` method.
 * The StreamManager will create the consumer group (if needed) and start a
 * background loop that reads messages and dispatches them to `process()`.
 *
 * @param stream - The stream name to consume from.
 * @param group - The consumer group name.
 * @param options - Optional consumer loop configuration.
 * @returns A class decorator.
 *
 * @example
 * ```typescript
 * @StreamProcessor('orders:events', 'notification-service')
 * @Injectable()
 * export class OrderNotificationProcessor {
 *   async process(message: IStreamMessage): Promise<void> {
 *     const { orderId, status } = message.fields;
 *     await this.notificationService.send(orderId, status);
 *   }
 * }
 * ```
 */
export function StreamProcessor(
  stream: string,
  group: string,
  options?: IStreamConsumerLoopOptions
): ClassDecorator {
  return (target: Function) => {
    const metadata: IStreamProcessorMetadata = { stream, group, options };
    defineMetadata(STREAM_PROCESSOR_METADATA_KEY, metadata, target);
  };
}
