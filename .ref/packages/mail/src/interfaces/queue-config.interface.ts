import type { JobsOptions, WorkerOptions, QueueOptions } from 'bullmq';

/**
 * Queue retry strategy types
 *
 * Defines different retry strategies for failed email jobs:
 * - exponential: Doubles delay each retry (1s, 2s, 4s, 8s...)
 * - linear: Adds fixed delay each retry (1s, 2s, 3s, 4s...)
 * - fixed: Uses same delay for all retries
 * - custom: User-defined function
 */
export type QueueRetryStrategy = 'exponential' | 'linear' | 'fixed' | 'custom';

/**
 * Custom retry strategy function
 *
 * @param attemptsMade - Number of retry attempts made so far
 * @param error - Error that caused the job to fail
 * @returns Delay in milliseconds before next retry
 */
export type CustomRetryStrategyFn = (attemptsMade: number, error: Error) => number;

/**
 * Queue retry configuration
 *
 * Configures retry behavior for failed email jobs with exponential backoff,
 * max attempts, and dead letter queue support.
 *
 * @interface QueueRetryConfig
 *
 * @example
 * ```typescript
 * const retryConfig: QueueRetryConfig = {
 *   strategy: 'exponential',
 *   maxAttempts: 5,
 *   initialDelay: 1000,
 *   maxDelay: 60000,
 *   factor: 2,
 *   deadLetterQueue: true,
 * };
 * ```
 */
export interface QueueRetryConfig {
  /**
   * Retry strategy to use
   * @default 'exponential'
   */
  strategy?: QueueRetryStrategy;

  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxAttempts?: number;

  /**
   * Initial delay in milliseconds before first retry
   * @default 1000
   */
  initialDelay?: number;

  /**
   * Maximum delay in milliseconds between retries
   * @default 60000 (1 minute)
   */
  maxDelay?: number;

  /**
   * Factor for exponential/linear strategies
   * - Exponential: multiplier for each retry (2 = double)
   * - Linear: added milliseconds for each retry
   * @default 2
   */
  factor?: number;

  /**
   * Custom retry strategy function
   * Only used when strategy is 'custom'
   */
  customStrategy?: CustomRetryStrategyFn;

  /**
   * Move failed jobs to dead letter queue after max attempts
   * @default true
   */
  deadLetterQueue?: boolean;
}

/**
 * Queue rate limiting configuration
 *
 * Controls job processing rate to avoid overwhelming email providers
 * and respect their rate limits.
 *
 * @interface QueueRateLimitConfig
 *
 * @example
 * ```typescript
 * // Process max 100 emails per minute
 * const rateLimitConfig: QueueRateLimitConfig = {
 *   max: 100,
 *   duration: 60000,
 *   groupKey: 'default',
 * };
 * ```
 */
export interface QueueRateLimitConfig {
  /**
   * Maximum number of jobs to process
   */
  max: number;

  /**
   * Time window in milliseconds
   */
  duration: number;

  /**
   * Group key for rate limiting (e.g., by transport, tenant)
   * @default 'default'
   */
  groupKey?: string;
}

/**
 * Queue monitoring and telemetry configuration
 *
 * Enables metrics collection, event tracking, and health checks
 * for production monitoring.
 *
 * @interface QueueMonitoringConfig
 */
export interface QueueMonitoringConfig {
  /**
   * Enable metrics collection (job counts, durations, etc.)
   * @default true
   */
  enableMetrics?: boolean;

  /**
   * Enable detailed job logging
   * @default false
   */
  enableJobLogging?: boolean;

  /**
   * Enable health checks endpoint
   * @default true
   */
  enableHealthChecks?: boolean;

  /**
   * Interval for metrics collection in milliseconds
   * @default 60000 (1 minute)
   */
  metricsInterval?: number;

  /**
   * Custom event handlers for job lifecycle events
   */
  eventHandlers?: {
    onCompleted?: (jobId: string, result: any) => void | Promise<void>;
    onFailed?: (jobId: string, error: Error) => void | Promise<void>;
    onProgress?: (jobId: string, progress: number) => void | Promise<void>;
    onStalled?: (jobId: string) => void | Promise<void>;
  };
}

/**
 * Queue job options configuration
 *
 * Per-job configuration for priority, delays, timeout, and retry behavior.
 * Extends BullMQ's JobsOptions with additional type safety.
 *
 * @interface QueueJobOptions
 *
 * @example
 * ```typescript
 * // High priority transactional email with custom retry
 * const jobOptions: QueueJobOptions = {
 *   priority: 1,
 *   attempts: 5,
 *   backoff: {
 *     type: 'exponential',
 *     delay: 2000,
 *   },
 *   removeOnComplete: 100,
 *   removeOnFail: 1000,
 * };
 * ```
 */
export interface QueueJobOptions extends Omit<JobsOptions, 'repeat'> {
  /**
   * Job priority (lower number = higher priority)
   * Range: 1-10 (1 = highest, 10 = lowest)
   * @default 5
   */
  priority?: number;

  /**
   * Delay in milliseconds before job is processed
   * Useful for scheduled emails
   */
  delay?: number;

  /**
   * Maximum number of retry attempts
   * @default 3
   */
  attempts?: number;

  /**
   * Backoff strategy for retries
   */
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };

  /**
   * Job timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Remove job from queue on completion
   * - true: remove immediately
   * - false: keep forever
   * - number: keep last N completed jobs
   * @default 100
   */
  removeOnComplete?: boolean | number;

  /**
   * Remove job from queue on failure
   * - true: remove immediately
   * - false: keep forever
   * - number: keep last N failed jobs
   * @default 1000
   */
  removeOnFail?: boolean | number;

  /**
   * Job lifespan in milliseconds (TTL)
   * Job is removed after this duration regardless of state
   */
  lifespan?: number;
}

/**
 * Main queue configuration interface
 *
 * Complete configuration for the mail queue system including Redis connection,
 * worker settings, retry policies, rate limiting, and monitoring.
 *
 * @interface MailQueueConfig
 *
 * @example
 * ```typescript
 * const queueConfig: MailQueueConfig = {
 *   enabled: true,
 *   connection: {
 *     host: 'localhost',
 *     port: 6379,
 *   },
 *   queueName: 'mail',
 *   defaultJobOptions: {
 *     priority: 5,
 *     attempts: 3,
 *     removeOnComplete: 100,
 *   },
 *   retry: {
 *     strategy: 'exponential',
 *     maxAttempts: 5,
 *     initialDelay: 1000,
 *   },
 *   rateLimit: {
 *     max: 100,
 *     duration: 60000,
 *   },
 *   monitoring: {
 *     enableMetrics: true,
 *     enableHealthChecks: true,
 *   },
 * };
 * ```
 */
export interface MailQueueConfig {
  /**
   * Enable queue processing
   * If false, emails are sent synchronously
   * @default false
   */
  enabled?: boolean;

  /**
   * Redis connection configuration
   * Can be a connection string or RedisOptions object
   */
  connection?:
    | string
    | {
        host?: string;
        port?: number;
        password?: string;
        db?: number;
        username?: string;
        tls?: any;
        maxRetriesPerRequest?: number;
        enableReadyCheck?: boolean;
        enableOfflineQueue?: boolean;
      };

  /**
   * Queue name (used as Redis key prefix)
   * @default 'mail'
   */
  queueName?: string;

  /**
   * Default job options applied to all jobs
   */
  defaultJobOptions?: QueueJobOptions;

  /**
   * Worker configuration
   */
  worker?: Partial<WorkerOptions> & {
    /**
     * Number of concurrent jobs to process
     * @default 5
     */
    concurrency?: number;

    /**
     * Minimum time to wait between jobs (ms)
     * @default 0
     */
    limiter?: {
      max: number;
      duration: number;
    };
  };

  /**
   * Queue-specific options
   */
  queue?: Partial<QueueOptions>;

  /**
   * Retry configuration
   */
  retry?: QueueRetryConfig;

  /**
   * Rate limiting configuration
   */
  rateLimit?: QueueRateLimitConfig;

  /**
   * Monitoring and telemetry configuration
   */
  monitoring?: QueueMonitoringConfig;

  /**
   * Dead letter queue configuration
   */
  deadLetterQueue?: {
    /**
     * Enable dead letter queue for failed jobs
     * @default true
     */
    enabled?: boolean;

    /**
     * Queue name for dead letter queue
     * @default 'mail:dead-letter'
     */
    queueName?: string;

    /**
     * Maximum age of dead letter jobs in milliseconds
     * Jobs older than this are permanently deleted
     * @default 604800000 (7 days)
     */
    maxAge?: number;
  };

  /**
   * Prefix for all queue keys in Redis
   * Useful for multi-tenant or namespacing
   * @default 'bull'
   */
  prefix?: string;
}

/**
 * Queue statistics interface
 *
 * Provides real-time metrics about queue health and performance.
 *
 * @interface QueueStats
 */
export interface QueueStats {
  /**
   * Total jobs waiting to be processed
   */
  waiting: number;

  /**
   * Jobs currently being processed
   */
  active: number;

  /**
   * Successfully completed jobs
   */
  completed: number;

  /**
   * Failed jobs
   */
  failed: number;

  /**
   * Delayed jobs (scheduled for future)
   */
  delayed: number;

  /**
   * Paused jobs
   */
  paused: number;

  /**
   * Average job processing time in milliseconds
   */
  avgProcessingTime?: number;

  /**
   * Jobs processed per minute
   */
  throughput?: number;

  /**
   * Error rate (failed / total)
   */
  errorRate?: number;
}
