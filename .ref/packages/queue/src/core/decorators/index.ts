/**
 * @file index.ts
 * @module @stackra/queue/core/decorators
 * @description Barrel export for queue decorators.
 */
export { Processor, type ProcessorOptions } from './processor.decorator';
export { OnJobEvent, type JobEventType } from './on-job-event.decorator';
export { InjectQueue } from './inject-queue.decorator';
export { InjectQueueConnection } from './inject-queue-connection.decorator';
