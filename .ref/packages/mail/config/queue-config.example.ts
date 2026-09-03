import type { MailQueueConfig } from '../src/interfaces';
import { MAIL_JOB_PRIORITIES } from '../src/constants';

/**
 * Queue Configuration Examples
 *
 * This file contains example configurations for different deployment scenarios.
 * Copy and adapt these to your needs.
 */

// ============================================================================
// Basic Configuration (Development/Testing)
// ============================================================================

/**
 * Minimal queue configuration for local development
 *
 * - Local Redis instance
 * - Standard retry behavior
 * - No monitoring overhead
 */
export const basicQueueConfig: MailQueueConfig = {
  enabled: true,
  connection: {
    host: 'localhost',
    port: 6379,
  },
  queueName: 'mail',
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: true,
    removeOnFail: false,
  },
};

// ============================================================================
// Production Configuration (High Volume)
// ============================================================================

/**
 * Production-ready configuration with full enterprise features
 *
 * - Redis cluster or managed instance
 * - Aggressive retry with exponential backoff
 * - Dead letter queue for failed jobs
 * - Rate limiting to respect provider limits
 * - Full monitoring and metrics
 * - Worker concurrency tuning
 */
export const productionQueueConfig: MailQueueConfig = {
  enabled: true,

  // Redis connection - use environment variables
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    // TLS for production
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
    // Retry connection on failure
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: true,
  },

  // Queue settings
  queueName: 'mail',
  prefix: 'bull', // Redis key prefix

  // Default job options (can be overridden per job)
  defaultJobOptions: {
    priority: MAIL_JOB_PRIORITIES.NORMAL,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2s delay
    },
    timeout: 30000, // 30s timeout per job
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 1000, // Keep last 1000 failed jobs for debugging
  },

  // Worker configuration
  worker: {
    concurrency: 10, // Process 10 emails concurrently
    limiter: {
      max: 100, // Max 100 jobs
      duration: 60000, // Per minute
    },
  },

  // Retry strategy
  retry: {
    strategy: 'exponential',
    maxAttempts: 5,
    initialDelay: 2000,
    maxDelay: 60000, // Cap at 1 minute
    factor: 2, // Double delay each retry
    deadLetterQueue: true,
  },

  // Rate limiting (respect provider limits)
  rateLimit: {
    max: 100, // 100 emails
    duration: 60000, // Per minute
    groupKey: 'default',
  },

  // Monitoring and telemetry
  monitoring: {
    enableMetrics: true,
    enableJobLogging: true,
    enableHealthChecks: true,
    metricsInterval: 60000, // Collect metrics every minute
    eventHandlers: {
      onCompleted: async (jobId, result) => {
        console.log(`✓ Email sent successfully: ${jobId}`, result);
      },
      onFailed: async (jobId, error) => {
        console.error(`✗ Email failed permanently: ${jobId}`, error);
        // Send to error tracking (Sentry, Datadog, etc.)
      },
    },
  },

  // Dead letter queue
  deadLetterQueue: {
    enabled: true,
    queueName: 'mail:dead-letter',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
};

// ============================================================================
// High-Priority Transactional (Low Latency)
// ============================================================================

/**
 * Optimized for time-sensitive transactional emails
 *
 * - High concurrency
 * - Minimal retry delays
 * - No rate limiting
 * - Quick cleanup
 */
export const transactionalQueueConfig: MailQueueConfig = {
  enabled: true,
  connection: process.env.REDIS_URL!,
  queueName: 'mail:transactional',

  defaultJobOptions: {
    priority: MAIL_JOB_PRIORITIES.CRITICAL,
    attempts: 3,
    backoff: {
      type: 'fixed',
      delay: 1000, // Quick retry
    },
    timeout: 10000, // 10s timeout
    removeOnComplete: true, // Clean up immediately
    removeOnFail: 50, // Keep minimal failed jobs
  },

  worker: {
    concurrency: 20, // High concurrency for low latency
  },

  retry: {
    strategy: 'fixed',
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 5000,
  },

  monitoring: {
    enableMetrics: true,
    enableJobLogging: false, // Reduce overhead
    enableHealthChecks: true,
  },
};

// ============================================================================
// Marketing/Bulk Emails (High Volume)
// ============================================================================

/**
 * Optimized for bulk marketing campaigns
 *
 * - Rate limited to avoid spam flags
 * - Lower priority
 * - Batch-friendly settings
 * - Aggressive cleanup
 */
export const bulkQueueConfig: MailQueueConfig = {
  enabled: true,
  connection: process.env.REDIS_URL!,
  queueName: 'mail:bulk',

  defaultJobOptions: {
    priority: MAIL_JOB_PRIORITIES.BULK,
    attempts: 2, // Fewer retries for bulk
    backoff: {
      type: 'fixed',
      delay: 5000,
    },
    timeout: 60000, // Longer timeout
    removeOnComplete: 10, // Aggressive cleanup
    removeOnFail: 100,
  },

  worker: {
    concurrency: 5, // Lower concurrency
  },

  retry: {
    strategy: 'fixed',
    maxAttempts: 2,
    initialDelay: 5000,
  },

  // Strict rate limiting for bulk sends
  rateLimit: {
    max: 50, // 50 emails per minute
    duration: 60000,
    groupKey: 'bulk',
  },

  monitoring: {
    enableMetrics: true,
    enableJobLogging: false,
    enableHealthChecks: true,
    metricsInterval: 300000, // 5 minutes
  },
};

// ============================================================================
// Scheduled Emails (Delayed Jobs)
// ============================================================================

/**
 * For emails scheduled for future delivery
 *
 * - Support for delayed jobs
 * - Standard priority
 * - Standard retry behavior
 */
export const scheduledQueueConfig: MailQueueConfig = {
  enabled: true,
  connection: process.env.REDIS_URL!,
  queueName: 'mail:scheduled',

  defaultJobOptions: {
    priority: MAIL_JOB_PRIORITIES.NORMAL,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
    // delay is set per-job when queueing
  },

  worker: {
    concurrency: 5,
  },

  retry: {
    strategy: 'exponential',
    maxAttempts: 3,
    initialDelay: 2000,
    maxDelay: 30000,
  },

  monitoring: {
    enableMetrics: true,
    enableJobLogging: true,
    enableHealthChecks: true,
  },
};

// ============================================================================
// Usage Examples in Your Application
// ============================================================================

/**
 * Example 1: Basic setup in AppModule
 *
 * ```typescript
 * import { MailModule } from '@nesvel/nestjs-mail';
 * import { basicQueueConfig } from './config/queue-config.example';
 *
 * @Module({
 *   imports: [
 *     MailModule.forRootAsync({
 *       queue: basicQueueConfig,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */

/**
 * Example 2: Environment-based configuration
 *
 * ```typescript
 * import { MailModule } from '@nesvel/nestjs-mail';
 *
 * @Module({
 *   imports: [
 *     MailModule.forRootAsync({
 *       queue: {
 *         enabled: process.env.QUEUE_ENABLED === 'true',
 *         connection: process.env.REDIS_URL,
 *         worker: {
 *           concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5', 10),
 *         },
 *         retry: {
 *           strategy: 'exponential',
 *           maxAttempts: parseInt(process.env.QUEUE_MAX_ATTEMPTS || '3', 10),
 *         },
 *       },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */

/**
 * Example 3: Multiple queues for different email types
 *
 * You can create separate queue configurations and import MailModule multiple times
 * with different queue names:
 *
 * ```typescript
 * import { MailModule } from '@nesvel/nestjs-mail';
 *
 * @Module({
 *   imports: [
 *     // Transactional emails
 *     MailModule.forRootAsync({
 *       queue: {
 *         ...transactionalQueueConfig,
 *         queueName: 'mail:transactional',
 *       },
 *     }),
 *     // Bulk emails
 *     MailModule.forRootAsync({
 *       isGlobal: false, // Not global for this one
 *       queue: {
 *         ...bulkQueueConfig,
 *         queueName: 'mail:bulk',
 *       },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */

/**
 * Example 4: Using the queue service directly
 *
 * ```typescript
 * import { Injectable } from '@nestjs/common';
 * import { MailQueueService, MAIL_JOB_PRIORITIES } from '@nesvel/nestjs-mail';
 *
 * @Injectable()
 * export class NotificationService {
 *   constructor(private readonly queueService: MailQueueService) {}
 *
 *   async sendPasswordReset(user: User, token: string) {
 *     const mailable = PasswordResetEmail.make(user, token);
 *
 *     await this.queueService.addMailJob(mailable, {
 *       priority: MAIL_JOB_PRIORITIES.CRITICAL,
 *       attempts: 5,
 *       timeout: 10000,
 *     });
 *   }
 *
 *   async scheduleFollowUp(user: User, delay: number) {
 *     const mailable = FollowUpEmail.make(user);
 *
 *     await this.queueService.addMailJob(mailable, {
 *       delay, // Milliseconds until sending
 *       priority: MAIL_JOB_PRIORITIES.LOW,
 *     });
 *   }
 *
 *   async getQueueHealth() {
 *     return await this.queueService.getQueueStats();
 *   }
 * }
 * ```
 */

/**
 * Example 5: Monitoring queue health
 *
 * ```typescript
 * import { Injectable } from '@nestjs/common';
 * import { MailQueueService } from '@nesvel/nestjs-mail';
 * import { Cron } from '@nestjs/schedule';
 *
 * @Injectable()
 * export class QueueHealthService {
 *   constructor(private readonly queueService: MailQueueService) {}
 *
 *   @Cron('*/ 5; /* * * *') // Every 5 minutes
 *   async checkQueueHealth() {
 *     const stats = await this.queueService.getQueueStats();
 *
 *     // Alert if error rate is high
 *     if (stats.errorRate && stats.errorRate > 10) {
 *       console.error('High email failure rate:', stats.errorRate);
 *       // Send alert to monitoring system
 *     }
 *
 *     // Alert if queue is backed up
 *     if (stats.waiting > 1000) {
 *       console.warn('Large queue backlog:', stats.waiting);
 *       // Consider scaling workers
 *     }
 *
 *     // Clean old jobs weekly
 *     if (new Date().getDay() === 0) { // Sunday
 *       await this.queueService.cleanQueue(7 * 24 * 60 * 60 * 1000);
 *     }
 *   }
 * }
 * ```
 */

// ============================================================================
// Redis Configuration Tips
// ============================================================================

/**
 * Production Redis Setup:
 *
 * 1. **Use Redis Cluster or Managed Service**
 *    - AWS ElastiCache
 *    - Redis Cloud
 *    - Azure Cache for Redis
 *    - Google Cloud Memorystore
 *
 * 2. **Enable Persistence**
 *    - AOF (Append Only File) for durability
 *    - RDB snapshots for backup
 *
 * 3. **Configure Memory**
 *    - Set maxmemory policy: allkeys-lru or volatile-lru
 *    - Monitor memory usage
 *
 * 4. **Security**
 *    - Enable TLS/SSL
 *    - Use strong password
 *    - Restrict network access
 *    - Rotate credentials regularly
 *
 * 5. **Monitoring**
 *    - Monitor queue sizes
 *    - Track job processing times
 *    - Alert on high failure rates
 *    - Monitor Redis memory and CPU
 */
