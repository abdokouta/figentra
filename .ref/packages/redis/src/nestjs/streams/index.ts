/**
 * @file index.ts
 * @module @stackra/nestjs-redis/streams
 * @description Barrel export for Redis Streams services and decorators.
 */

export { StreamProducerService } from './stream-producer.service';
export { StreamConsumerService } from './stream-consumer.service';
export { StreamManager } from './stream-manager.service';
export { StreamProcessor, STREAM_PROCESSOR_METADATA_KEY } from './stream-processor.decorator';
export type {
  IStreamProducerOptions,
  IStreamConsumerLoopOptions,
  IStreamProcessorMetadata,
} from './interfaces';
