/**
 * @file index.ts
 * @module @stackra/queue/nestjs
 * @description NestJS queue adapter — BullMQ connector and module.
 *   Wraps @nestjs/bullmq for server-side BullMQ queue processing.
 *   Re-exports core for convenience.
 */

// ════════════════════════════════════════════════════════════════════════════════
// NestJS Module
// ════════════════════════════════════════════════════════════════════════════════
export { NestQueueModule } from './nest-queue.module';

// ════════════════════════════════════════════════════════════════════════════════
// Connectors
// ════════════════════════════════════════════════════════════════════════════════
export { BullMQConnector } from './connectors';

// ════════════════════════════════════════════════════════════════════════════════
// Re-export core
// ════════════════════════════════════════════════════════════════════════════════
export {
  QueueModule,
  QueueManager,
  QueueHandle,
  QueueEventBus,
  Worker,
  type JobHandler,
  MemoryConnector,
  SyncConnector,
  NullConnector,
  LocalStorageConnector,
  IndexedDBConnector,
  BroadcastChannelConnector,
  QStashConnector,
  Processor,
  type ProcessorOptions,
  OnJobEvent,
  type JobEventType,
  InjectQueue,
  InjectQueueConnection,
  QueueError,
  QueueDriverError,
  MaxAttemptsExceededError,
  TimeoutExceededError,
  defineConfig,
  getQueueToken,
  getQueueConnectionToken,
  generateJobId,
  computeBackoff,
  computeUniqueId,
} from '../core';
export type {
  IQueueConnection,
  IQueueConnector,
  IQueueModuleOptions,
  QueueConnectionConfig,
  IWorkerOptions,
  IJobOptions,
  IQueuedJob,
} from '../core';
