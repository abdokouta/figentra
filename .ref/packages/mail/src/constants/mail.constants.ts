/**
 * Mail Service Injection Token
 *
 * Constant token used for dependency injection of the MailService.
 * This token is used internally by the MailModule to register
 * the service in the NestJS dependency injection container.
 *
 * **Usage**:
 * - Internal: Used by MailModule for service registration
 * - External: Can be used with @Inject() for manual injection
 * - Recommended: Use @InjectMailService() decorator instead
 *
 * @constant
 *
 * @example Manual injection with @Inject
 * ```typescript
 * import { Inject } from '@nestjs/common';
 * import { MAIL_SERVICE } from '@nesvel/nestjs-mail';
 *
 * @Injectable()
 * export class MyService {
 *   constructor(
 *     @Inject(MAIL_SERVICE) private readonly mail: MailService
 *   ) {}
 * }
 * ```
 *
 * @example Recommended approach with decorator
 * ```typescript
 * import { InjectMailService } from '@nesvel/nestjs-mail';
 *
 * @Injectable()
 * export class MyService {
 *   constructor(
 *     @InjectMailService() private readonly mail: MailService
 *   ) {}
 * }
 * ```
 *
 * @author Nesvel
 * @since 1.0.0
 */
export const MAIL_SERVICE = 'MAIL_SERVICE';

/**
 * Mail Options Injection Token
 *
 * Constant token used for dependency injection of mail configuration options.
 * This token is used internally by the MailModule to provide configuration
 * to services and factories.
 *
 * **Usage**:
 * - Internal: Used by MailModule for configuration injection
 * - External: Can be used to access mail configuration in custom services
 *
 * @constant
 *
 * @example Accessing mail configuration
 * ```typescript
 * import { Inject } from '@nestjs/common';
 * import { MAIL_OPTIONS } from '@nesvel/nestjs-mail';
 * import type { IMailConfig } from '@nesvel/nestjs-mail';
 *
 * @Injectable()
 * export class CustomMailService {
 *   constructor(
 *     @Inject(MAIL_OPTIONS) private readonly config: IMailConfig
 *   ) {
 *     console.log('SMTP Host:', config.smtp?.host);
 *   }
 * }
 * ```
 *
 * @author Nesvel
 * @since 1.0.0
 */
export const MAIL_OPTIONS = 'MAIL_OPTIONS';

/**
 * Mail Transport Injection Token
 *
 * Constant token used for dependency injection of the mail transport.
 * The transport is the underlying Nodemail transporter instance.
 *
 * **Usage**:
 * - Internal: Used by MailModule and MailService
 * - External: Advanced use cases requiring direct transporter access
 *
 * @constant
 *
 * @example Accessing the transporter directly
 * ```typescript
 * import { Inject } from '@nestjs/common';
 * import { MAIL_TRANSPORT } from '@nesvel/nestjs-mail';
 * import type { Transporter } from 'nodemailer';
 *
 * @Injectable()
 * export class AdvancedMailService {
 *   constructor(
 *     @Inject(MAIL_TRANSPORT) private readonly transport: Transporter
 *   ) {}
 *
 *   async sendRaw(options: any) {
 *     return this.transport.sendMail(options);
 *   }
 * }
 * ```
 *
 * @author Nesvel
 * @since 1.0.0
 */
export const MAIL_TRANSPORT = 'MAIL_TRANSPORT';

/**
 * Mail Queue Name
 *
 * Default queue name for mail job processing.
 * Used as the Redis key prefix for all mail-related jobs.
 *
 * @constant
 *
 * @example
 * ```typescript
 * // Queue will create keys like:
 * // bull:mail:1 (job 1)
 * // bull:mail:2 (job 2)
 * // bull:mail:wait (waiting jobs list)
 * // bull:mail:active (active jobs list)
 * ```
 */
export const MAIL_QUEUE_NAME = 'mail';

/**
 * Mail Queue Injection Token
 *
 * Constant token used for dependency injection of the BullMQ Queue instance.
 * Use this to access the queue directly for advanced operations.
 *
 * @constant
 *
 * @example
 * ```typescript
 * import { Inject } from '@nestjs/common';
 * import { MAIL_QUEUE } from '@nesvel/nestjs-mail';
 * import type { Queue } from 'bullmq';
 *
 * @Injectable()
 * export class QueueMonitorService {
 *   constructor(
 *     @Inject(MAIL_QUEUE) private readonly queue: Queue
 *   ) {}
 *
 *   async getStats() {
 *     const waiting = await this.queue.getWaitingCount();
 *     const active = await this.queue.getActiveCount();
 *     const failed = await this.queue.getFailedCount();
 *     return { waiting, active, failed };
 *   }
 * }
 * ```
 */
export const MAIL_QUEUE = 'MAIL_QUEUE';

/**
 * Mail Queue Service Injection Token
 *
 * Constant token used for dependency injection of the MailQueueService.
 * This is the high-level service for queue operations.
 *
 * @constant
 *
 * @example
 * ```typescript
 * import { Inject } from '@nestjs/common';
 * import { MAIL_QUEUE_SERVICE } from '@nesvel/nestjs-mail';
 * import type { MailQueueService } from '@nesvel/nestjs-mail';
 *
 * @Injectable()
 * export class NotificationService {
 *   constructor(
 *     @Inject(MAIL_QUEUE_SERVICE) private readonly queueService: MailQueueService
 *   ) {}
 *
 *   async scheduleEmail(mailable: Mailable, delay: number) {
 *     await this.queueService.addMailJob(mailable, { delay });
 *   }
 * }
 * ```
 */
export const MAIL_QUEUE_SERVICE = 'MAIL_QUEUE_SERVICE';

/**
 * Dead Letter Queue Name
 *
 * Queue name for failed jobs that exceeded max retry attempts.
 * These jobs are moved here for manual inspection and recovery.
 *
 * @constant
 */
export const DEAD_LETTER_QUEUE_NAME = 'mail:dead-letter';

/**
 * Mail Job Types
 *
 * Enum-like object defining different types of mail jobs.
 * Used for job identification and processing logic.
 *
 * @constant
 *
 * @example
 * ```typescript
 * import { MAIL_JOB_TYPES } from '@nesvel/nestjs-mail';
 *
 * // Add job with specific type
 * await queue.add(MAIL_JOB_TYPES.SEND_MAIL, mailData);
 * await queue.add(MAIL_JOB_TYPES.SEND_BATCH, batchData);
 * ```
 */
export const MAIL_JOB_TYPES = {
  /**
   * Standard mail send job
   * Processes a single email via the Mailable system
   */
  SEND_MAIL: 'send:mail',

  /**
   * Batch email send job
   * Processes multiple emails in a single job
   */
  SEND_BATCH: 'send:batch',

  /**
   * Scheduled email job
   * Email scheduled for future delivery
   */
  SEND_SCHEDULED: 'send:scheduled',

  /**
   * Retry failed email job
   * Explicit retry of a previously failed email
   */
  RETRY_FAILED: 'retry:failed',
} as const;

/**
 * Mail Job Priority Levels
 *
 * Predefined priority levels for different email types.
 * Lower numbers = higher priority.
 *
 * @constant
 *
 * @example
 * ```typescript
 * import { MAIL_JOB_PRIORITIES } from '@nesvel/nestjs-mail';
 *
 * // High priority transactional email
 * await queueService.addMailJob(mailable, {
 *   priority: MAIL_JOB_PRIORITIES.CRITICAL,
 * });
 *
 * // Low priority marketing email
 * await queueService.addMailJob(newsletter, {
 *   priority: MAIL_JOB_PRIORITIES.LOW,
 * });
 * ```
 */
export const MAIL_JOB_PRIORITIES = {
  /**
   * Critical priority (1)
   * For time-sensitive transactional emails:
   * - Password resets
   * - Email verification
   * - Security alerts
   * - OTP codes
   */
  CRITICAL: 1,

  /**
   * High priority (3)
   * For important transactional emails:
   * - Order confirmations
   * - Payment receipts
   * - Shipping notifications
   */
  HIGH: 3,

  /**
   * Normal priority (5)
   * Default for most emails:
   * - Account notifications
   * - Activity updates
   * - System messages
   */
  NORMAL: 5,

  /**
   * Low priority (7)
   * For non-urgent emails:
   * - Digest emails
   * - Weekly summaries
   * - Recommendations
   */
  LOW: 7,

  /**
   * Bulk priority (10)
   * For marketing and bulk emails:
   * - Newsletters
   * - Promotional campaigns
   * - Announcements
   */
  BULK: 10,
} as const;
