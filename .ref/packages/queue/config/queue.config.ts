/**
 * @file queue.config.ts
 * @module @stackra/queue/config
 * @description Application-level queue configuration.
 *   Consumed by `QueueModule.forRoot()` at bootstrap.
 */

import { IdefineConfig } from '@stackra/queue';

export default IdefineConfig({
  /*
  |--------------------------------------------------------------------------
  | Global Registration
  |--------------------------------------------------------------------------
  |
  | When true, the queue module is registered globally so all modules can
  | inject QueueManager and dispatch jobs without re-importing.
  |
  */
  global: true,

  /*
  |--------------------------------------------------------------------------
  | Emit Lifecycle Events
  |--------------------------------------------------------------------------
  |
  | When true, the queue system emits lifecycle events (job.dispatched,
  | job.started, job.completed, job.failed, job.dead) through the
  | @stackra/events EventEmitter for observability and monitoring.
  |
  */
  emitEvents: true,

  /*
  |--------------------------------------------------------------------------
  | Queue Prefix
  |--------------------------------------------------------------------------
  |
  | A global prefix applied to all queue names across all connections.
  | Useful for environment isolation when sharing a backend (e.g., Redis)
  | across dev, staging, and production.
  |
  */
  prefix: '',

  /*
  |--------------------------------------------------------------------------
  | Default Queue Connection
  |--------------------------------------------------------------------------
  |
  | This option controls the default queue connection that gets used when
  | dispatching jobs without specifying an explicit connection.
  |
  */
  default: 'memory',

  /*
  |--------------------------------------------------------------------------
  | Queue Connections
  |--------------------------------------------------------------------------
  |
  | Here you may configure the connection information for each queue backend
  | used by your application.
  |
  | Drivers: "memory", "sync", "null", "local-storage", "indexeddb",
  |          "broadcast-channel", "qstash", "bullmq" (via nestjs subpath)
  |
  */
  connections: {
    memory: { driver: 'memory' },
    sync: { driver: 'sync' },
  },

  /*
  |--------------------------------------------------------------------------
  | Worker Options
  |--------------------------------------------------------------------------
  |
  | These options configure the default behavior of queue workers.
  |
  */
  worker: {
    tries: 3,
    backoffMs: 1000,
    maxBackoffMs: 30000,
    timeoutMs: 30000,
    pollIntervalMs: 500,
    autoStart: true,
    failOnTimeout: true,
  },

  /*
  |--------------------------------------------------------------------------
  | Default Job Options
  |--------------------------------------------------------------------------
  |
  | These defaults are applied to every dispatched job unless overridden
  | at the call site.
  |
  */
  defaultJobOptions: {
    tries: 3,
    backoffMs: 5000,
    removeOnComplete: true,
    removeOnFail: false,
  },
});
