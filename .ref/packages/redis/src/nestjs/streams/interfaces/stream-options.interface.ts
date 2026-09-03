/**
 * @file stream-options.interface.ts
 * @module @stackra/nestjs-redis/streams/interfaces
 * @description Internal configuration interfaces for Redis Streams
 *   producer and consumer services.
 */

/**
 * Options for the stream producer.
 */
export interface IStreamProducerOptions {
  /** Maximum stream length (MAXLEN ~). Trims old entries. */
  maxLen?: number;

  /** Connection name to use for stream operations. */
  connection?: string;
}

/**
 * Options for the stream consumer loop.
 */
export interface IStreamConsumerLoopOptions {
  /** Number of messages to read per batch. Default: 10. */
  batchSize?: number;

  /** Milliseconds to block waiting for new messages. Default: 5000. */
  blockMs?: number;

  /** Consumer name within the group. Default: auto-generated. */
  consumerName?: string;

  /** Connection name to use. */
  connection?: string;

  /** Start reading from this ID. Default: ">" (new messages only). */
  startId?: string;
}

/**
 * Metadata stored by the @StreamProcessor decorator.
 */
export interface IStreamProcessorMetadata {
  /** The stream name to consume from. */
  stream: string;

  /** The consumer group name. */
  group: string;

  /** Consumer loop options. */
  options?: IStreamConsumerLoopOptions;
}
