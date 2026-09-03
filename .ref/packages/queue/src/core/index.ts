/**
 * @file index.ts
 * @module @stackra/queue
 * @description Public API for the queue package (core entry point).
 *   Multi-driver job queue with processors, workers, and connectors.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════
export { QueueModule } from './queue.module';

// ════════════════════════════════════════════════════════════════════════════════
// Services
// ════════════════════════════════════════════════════════════════════════════════
export { QueueManager } from './services';
export { QueueHandle } from './services';
export { QueueEventBus } from './services';
export { Worker, type JobHandler } from './services';

// ════════════════════════════════════════════════════════════════════════════════
// Connectors
// ════════════════════════════════════════════════════════════════════════════════
export { MemoryConnector } from './connectors';
export { SyncConnector } from './connectors';
export { NullConnector } from './connectors';
export { LocalStorageConnector } from './connectors';
export { IndexedDBConnector } from './connectors';
export { BroadcastChannelConnector } from './connectors';
export { QStashConnector } from './connectors';

// ════════════════════════════════════════════════════════════════════════════════
// Decorators
// ════════════════════════════════════════════════════════════════════════════════
export { Processor, type ProcessorOptions } from './decorators';
export { OnJobEvent, type JobEventType } from './decorators';
export { InjectQueue } from './decorators';
export { InjectQueueConnection } from './decorators';

// ════════════════════════════════════════════════════════════════════════════════
// Errors
// ════════════════════════════════════════════════════════════════════════════════
export { QueueError } from './errors';
export { QueueDriverError } from './errors';
export { MaxAttemptsExceededError } from './errors';
export { TimeoutExceededError } from './errors';

// ════════════════════════════════════════════════════════════════════════════════
// Utilities
// ════════════════════════════════════════════════════════════════════════════════
export { defineConfig } from './utils';
export { getQueueToken, getQueueConnectionToken } from './utils';
export { generateJobId, computeBackoff, computeUniqueId } from './utils';

// ════════════════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════════════════
export {
  QUEUE_MANAGER,
  QUEUE_CONFIG,
  DEFAULT_QUEUE_CONNECTION,
  PROCESSOR_METADATA,
  ON_JOB_EVENT_METADATA,
  QUEUE_EVENTS,
} from './constants';

// ════════════════════════════════════════════════════════════════════════════════
// Interfaces
// ════════════════════════════════════════════════════════════════════════════════
export type { IQueueConnection } from './interfaces';
export type { IQueueConnector } from './interfaces';
export type { IQueueModuleOptions, QueueConnectionConfig, IWorkerOptions } from './interfaces';
export type { IJobOptions } from './interfaces';
export type { IQueuedJob } from './interfaces';
