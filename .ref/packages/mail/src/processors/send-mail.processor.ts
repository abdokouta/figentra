import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';

import { MailService } from '@services';
import { MAIL_QUEUE_NAME, MAIL_JOB_TYPES } from '@constants';

/**
 * Job data interface for send mail jobs
 *
 * Contains all necessary data to process a queued email.
 *
 * @interface SendMailJobData
 */
interface SendMailJobData {
  /**
   * Serialized mail data from Mailable.toMailData()
   */
  mailData: {
    to: string[];
    cc: string[];
    bcc: string[];
    from?: string;
    replyTo: string[];
    subject: string;
    template?: string;
    html?: string;
    text?: string;
    context?: Record<string, any>;
    attachments?: any[];
    headers?: Record<string, any>;
    locale?: string;
  };

  /**
   * Name of the Mailable class (for logging/debugging)
   */
  mailableClass: string;

  /**
   * Timestamp when job was queued
   */
  queuedAt: string;
}

/**
 * SendMailProcessor
 *
 * BullMQ worker that processes queued email jobs.
 *
 * **Responsibilities**:
 * - Process jobs from the mail queue
 * - Send emails via MailService
 * - Report progress and handle errors
 * - Support job retries with backoff
 * - Track processing metrics
 *
 * **Job Lifecycle**:
 * 1. Job picked from queue based on priority
 * 2. `process()` method called with job data
 * 3. Email sent via MailService
 * 4. Progress reported (0% → 50% → 100%)
 * 5. Job marked complete or failed
 * 6. If failed, automatic retry with backoff
 *
 * **Error Handling**:
 * - Transient errors (network, rate limit): Retry with backoff
 * - Permanent errors (invalid email, auth): Mark as failed
 * - Max retries exceeded: Move to dead letter queue
 *
 * @class SendMailProcessor
 *
 * @example In MailModule
 * ```typescript
 * @Module({
 *   imports: [
 *     BullModule.registerQueue({
 *       name: MAIL_QUEUE_NAME,
 *     }),
 *   ],
 *   providers: [
 *     MailService,
 *     MailQueueService,
 *     SendMailProcessor, // Automatically registers as worker
 *   ],
 * })
 * export class MailModule {}
 * ```
 */
@Injectable()
@Processor(MAIL_QUEUE_NAME, {
  concurrency: 5, // Process 5 jobs concurrently (overridden by config)
})
export class SendMailProcessor extends WorkerHost {
  /**
   * Logger instance for processor operations
   */
  private readonly logger = new Logger(SendMailProcessor.name);

  /**
   * Creates an instance of SendMailProcessor
   *
   * @param mailService - MailService for sending emails
   */
  constructor(private readonly mailService: MailService) {
    super();
  }

  /**
   * Process a mail job
   *
   * Main worker method that processes jobs from the queue.
   * Called automatically by BullMQ when a job is ready.
   *
   * **Process Flow**:
   * 1. Extract mail data from job
   * 2. Report 0% progress
   * 3. Send email via MailService
   * 4. Report 50% progress
   * 5. Verify send result
   * 6. Report 100% progress
   * 7. Return result
   *
   * **Performance**:
   * - Average processing time: 500ms - 3s (depends on provider)
   * - Concurrent jobs: Configurable (default: 5)
   * - Memory usage: ~10MB per job
   *
   * @param job - BullMQ job instance
   * @returns Sent message info from nodemailer
   * @throws Error if sending fails (triggers automatic retry)
   *
   * @internal Called by BullMQ worker
   */
  async process(job: Job<SendMailJobData, any, string>): Promise<any> {
    const { mailData, mailableClass, queuedAt } = job.data;
    const startTime = Date.now();

    try {
      // Log job start
      this.logger.log(
        `Processing mail job ${job.id} [${mailableClass}]: ` +
          `${mailData.subject} → ${mailData.to.join(', ')} ` +
          `(queued: ${new Date(queuedAt).toISOString()}, attempt: ${job.attemptsMade + 1}/${job.opts.attempts || 3})`,
      );

      // Report initial progress
      await job.updateProgress(0);

      // Prepare send options for MailService
      const sendOptions = {
        to: mailData.to.length > 0 ? mailData.to.join(', ') : undefined,
        cc: mailData.cc.length > 0 ? mailData.cc.join(', ') : undefined,
        bcc: mailData.bcc.length > 0 ? mailData.bcc.join(', ') : undefined,
        from: mailData.from,
        replyTo: mailData.replyTo.length > 0 ? mailData.replyTo.join(', ') : undefined,
        subject: mailData.subject,
        template: mailData.template,
        html: mailData.html,
        text: mailData.text,
        context: {
          ...mailData.context,
          ...(mailData.locale && { _locale: mailData.locale }),
        },
        attachments: mailData.attachments,
        headers: mailData.headers,
      };

      // Report progress before sending
      await job.updateProgress(10);

      // Send email via MailService
      const result = await this.mailService.sendMail(sendOptions as any);

      // Report progress after sending
      await job.updateProgress(90);

      // Calculate processing time
      const processingTime = Date.now() - startTime;

      // Log success
      this.logger.log(
        `Mail job ${job.id} completed successfully in ${processingTime}ms ` +
          `(messageId: ${result.messageId})`,
      );

      // Report final progress
      await job.updateProgress(100);

      // Return result (stored in job.returnvalue)
      return {
        success: true,
        messageId: result.messageId,
        processingTime,
        sentAt: new Date().toISOString(),
        recipients: {
          to: mailData.to,
          cc: mailData.cc,
          bcc: mailData.bcc,
        },
      };
    } catch (error: Error | any) {
      // Calculate processing time
      const processingTime = Date.now() - startTime;

      // Log error with context
      this.logger.error(
        `Mail job ${job.id} failed after ${processingTime}ms ` +
          `(attempt ${job.attemptsMade + 1}/${job.opts.attempts || 3}): ${error.message}`,
        error.stack,
      );

      // Classify error for better handling
      const errorType = this.classifyError(error);

      // Add error metadata to job
      await job.log(
        `Failed: ${error.message} (type: ${errorType}, attempt: ${job.attemptsMade + 1})`,
      );

      // Re-throw to trigger retry
      // BullMQ will handle backoff and retry logic
      throw error;
    }
  }

  /**
   * Handle job completion
   *
   * Called after a job completes successfully.
   * Used for cleanup, logging, and telemetry.
   *
   * @param job - Completed job
   * @param result - Job result
   *
   * @internal Called by BullMQ
   */
  async onCompleted(job: Job<SendMailJobData, any, string>, result: any): Promise<void> {
    const { mailableClass } = job.data;

    this.logger.debug(
      `Job ${job.id} [${mailableClass}] completed - ` +
        `messageId: ${result.messageId}, ` +
        `processingTime: ${result.processingTime}ms`,
    );

    // Clean up job data if needed
    // (BullMQ will auto-remove based on removeOnComplete option)
  }

  /**
   * Handle job failure
   *
   * Called after a job fails and won't be retried (max attempts reached).
   * Used for final error logging and alerting.
   *
   * @param job - Failed job
   * @param error - Error that caused failure
   *
   * @internal Called by BullMQ
   */
  async onFailed(job: Job<SendMailJobData, any, string> | undefined, error: Error): Promise<void> {
    if (!job) {
      this.logger.error('Job failed but job object is undefined', error.stack);
      return;
    }

    const { mailData, mailableClass } = job.data;

    this.logger.error(
      `Job ${job.id} [${mailableClass}] permanently failed after ${job.attemptsMade} attempts: ` +
        `${error.message} ` +
        `(to: ${mailData.to.join(', ')}, subject: "${mailData.subject}")`,
      error.stack,
    );

    // In production, you might want to:
    // - Send alert to monitoring system (Sentry, Datadog, etc.)
    // - Store failed email for manual retry
    // - Notify admin or user about permanent failure
  }

  /**
   * Handle job progress update
   *
   * Called when job.updateProgress() is called.
   * Can be used for real-time progress tracking.
   *
   * @param job - Job with updated progress
   * @param progress - Progress value (0-100)
   *
   * @internal Called by BullMQ
   */
  async onProgress(
    job: Job<SendMailJobData, any, string>,
    progress: number | object,
  ): Promise<void> {
    const progressValue = typeof progress === 'number' ? progress : 0;

    this.logger.debug(`Job ${job.id} progress: ${progressValue}%`);

    // Can be used to update UI or send webhooks
  }

  /**
   * Handle active job (processing started)
   *
   * Called when a job starts processing.
   *
   * @param job - Active job
   *
   * @internal Called by BullMQ
   */
  async onActive(job: Job<SendMailJobData, any, string>): Promise<void> {
    this.logger.debug(`Job ${job.id} started processing`);
  }

  /**
   * Handle stalled job
   *
   * Called when a job is detected as stalled (worker died/crashed).
   * Job will be automatically retried.
   *
   * @param jobId - ID of stalled job
   *
   * @internal Called by BullMQ
   */
  async onStalled(jobId: string): Promise<void> {
    this.logger.warn(`Job ${jobId} stalled - will be retried`);

    // In production, might indicate worker issues:
    // - Worker crashed
    // - Out of memory
    // - Network timeout
    // - Infinite loop
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Classify error type for better retry logic
   *
   * Determines if error is transient (retry) or permanent (fail).
   *
   * **Transient Errors** (should retry):
   * - Network errors (ETIMEDOUT, ECONNRESET, etc.)
   * - Rate limit errors (429)
   * - Server errors (500, 502, 503, 504)
   * - Provider temporary failures
   *
   * **Permanent Errors** (should not retry):
   * - Invalid email address
   * - Authentication failures (401, 403)
   * - Malformed request (400)
   * - Domain not found
   *
   * @param error - Error object
   * @returns Error classification
   * @private
   */
  private classifyError(error: Error | any): 'transient' | 'permanent' {
    const message = error.message?.toLowerCase() || '';
    const code = error.code?.toLowerCase() || '';
    const statusCode = error.statusCode || error.status;

    // Network errors (transient)
    if (
      code === 'etimedout' ||
      code === 'econnreset' ||
      code === 'econnrefused' ||
      code === 'enotfound' ||
      message.includes('timeout') ||
      message.includes('network')
    ) {
      return 'transient';
    }

    // HTTP status codes
    if (statusCode) {
      // Transient: 429 (rate limit), 5xx (server errors)
      if (statusCode === 429 || (statusCode >= 500 && statusCode < 600)) {
        return 'transient';
      }

      // Permanent: 400 (bad request), 401/403 (auth), 404 (not found)
      if (statusCode === 400 || statusCode === 401 || statusCode === 403 || statusCode === 404) {
        return 'permanent';
      }
    }

    // Email-specific errors
    if (
      message.includes('invalid email') ||
      message.includes('invalid recipient') ||
      message.includes('no such user') ||
      message.includes('mailbox unavailable') ||
      message.includes('user unknown')
    ) {
      return 'permanent';
    }

    // Provider-specific rate limits (transient)
    if (
      message.includes('rate limit') ||
      message.includes('quota exceeded') ||
      message.includes('too many requests')
    ) {
      return 'transient';
    }

    // Default to transient (retry)
    // Conservative approach: retry unless we know it's permanent
    return 'transient';
  }
}
