import { Inject } from '@nestjs/common';

import { MAIL_TRANSPORT } from '../constants';

/**
 * Inject Mail Transport Decorator
 *
 * Decorator for injecting the mail transport instance into a class.
 *
 * This decorator is a convenience wrapper around NestJS's @Inject decorator,
 * providing a more semantic way to inject the mail transport layer. It uses the
 * MAIL_TRANSPORT injection token to retrieve the transport instance from the
 * NestJS dependency injection container.
 *
 * **Benefits**:
 * - Cleaner, more readable code
 * - Type-safe injection
 * - Consistent with other Nesvel decorators
 * - Better IDE autocomplete support
 *
 * The transport layer handles the low-level sending of emails through different
 * providers (SMTP, SendGrid, Mailgun, etc.). Using this decorator is equivalent
 * to using @Inject(MAIL_TRANSPORT) but provides better readability and makes
 * the intent clearer.
 *
 * @returns A parameter decorator for dependency injection
 *
 * @example Basic usage in a custom mail service
 * ```typescript
 * import { Injectable } from '@nestjs/common';
 * import { InjectMailTransport } from '@nesvel/nestjs-mail';
 * import type { IMailTransport } from '@nesvel/nestjs-mail';
 *
 * @Injectable()
 * export class CustomMailService {
 *   constructor(
 *     @InjectMailTransport() private readonly transport: IMailTransport
 *   ) {}
 *
 *   async sendRawEmail(to: string, subject: string, html: string) {
 *     return this.transport.send({
 *       to,
 *       subject,
 *       html,
 *     });
 *   }
 * }
 * ```
 *
 * @example Transport health monitoring
 * ```typescript
 * import { Injectable, Logger } from '@nestjs/common';
 * import { InjectMailTransport } from '@nesvel/nestjs-mail';
 * import type { IMailTransport } from '@nesvel/nestjs-mail';
 * import { Cron } from '@nestjs/schedule';
 *
 * @Injectable()
 * export class MailTransportMonitor {
 *   private readonly logger = new Logger(MailTransportMonitor.name);
 *
 *   constructor(
 *     @InjectMailTransport() private readonly transport: IMailTransport
 *   ) {}
 *
 *   @Cron('0 * * * *') // Every hour
 *   async checkTransportHealth() {
 *     try {
 *       const isHealthy = await this.transport.verify();
 *       this.logger.log(`Transport health check: ${isHealthy ? 'OK' : 'FAILED'}`);
 *     } catch (error: Error | any) {
 *       this.logger.error('Transport health check failed', error);
 *     }
 *   }
 * }
 * ```
 *
 * @example Bulk email sender with rate limiting
 * ```typescript
 * import { Injectable, Logger } from '@nestjs/common';
 * import { InjectMailTransport } from '@nesvel/nestjs-mail';
 * import type { IMailTransport } from '@nesvel/nestjs-mail';
 *
 * @Injectable()
 * export class BulkMailService {
 *   private readonly logger = new Logger(BulkMailService.name);
 *
 *   constructor(
 *     @InjectMailTransport() private readonly transport: IMailTransport
 *   ) {}
 *
 *   async sendBulkEmails(
 *     recipients: string[],
 *     subject: string,
 *     html: string,
 *     batchSize: number = 100
 *   ) {
 *     const results = [];
 *
 *     for (let i = 0; i < recipients.length; i += batchSize) {
 *       const batch = recipients.slice(i, i + batchSize);
 *       this.logger.log(`Sending batch ${i / batchSize + 1}`);
 *
 *       const batchResults = await Promise.allSettled(
 *         batch.map(to => this.transport.send({ to, subject, html }))
 *       );
 *
 *       results.push(...batchResults);
 *     }
 *
 *     return results;
 *   }
 * }
 * ```
 *
 * @example Email retry mechanism
 * ```typescript
 * import { Injectable, Logger } from '@nestjs/common';
 * import { InjectMailTransport } from '@nesvel/nestjs-mail';
 * import type { IMailTransport, ISendMailOptions } from '@nesvel/nestjs-mail';
 *
 * @Injectable()
 * export class RetryableMailService {
 *   private readonly logger = new Logger(RetryableMailService.name);
 *
 *   constructor(
 *     @InjectMailTransport() private readonly transport: IMailTransport
 *   ) {}
 *
 *   async sendWithRetry(
 *     options: ISendMailOptions,
 *     maxRetries: number = 3
 *   ) {
 *     let lastError: Error;
 *
 *     for (let attempt = 1; attempt <= maxRetries; attempt++) {
 *       try {
 *         return await this.transport.send(options);
 *       } catch (error: Error | any) {
 *         lastError = error;
 *         this.logger.warn(`Send attempt ${attempt} failed: ${error.message}`);
 *
 *         if (attempt < maxRetries) {
 *           await this.delay(1000 * attempt); // Exponential backoff
 *         }
 *       }
 *     }
 *
 *     throw new Error(`Failed to send email after ${maxRetries} attempts: ${lastError.message}`);
 *   }
 *
 *   private delay(ms: number): Promise<void> {
 *     return new Promise(resolve => setTimeout(resolve, ms));
 *   }
 * }
 * ```
 *
 * @example Multi-provider fallback
 * ```typescript
 * import { Injectable, Logger } from '@nestjs/common';
 * import { InjectMailTransport } from '@nesvel/nestjs-mail';
 * import type { IMailTransport, ISendMailOptions } from '@nesvel/nestjs-mail';
 *
 * @Injectable()
 * export class FallbackMailService {
 *   private readonly logger = new Logger(FallbackMailService.name);
 *
 *   constructor(
 *     @InjectMailTransport() private readonly primaryTransport: IMailTransport
 *   ) {}
 *
 *   async sendWithFallback(
 *     options: ISendMailOptions,
 *     fallbackTransport?: IMailTransport
 *   ) {
 *     try {
 *       return await this.primaryTransport.send(options);
 *     } catch (error: Error | any) {
 *       this.logger.error('Primary transport failed', error);
 *
 *       if (fallbackTransport) {
 *         this.logger.log('Attempting fallback transport');
 *         return await fallbackTransport.send(options);
 *       }
 *
 *       throw error;
 *     }
 *   }
 * }
 * ```
 *
 * @example Email queue processor
 * ```typescript
 * import { Injectable, Logger } from '@nestjs/common';
 * import { InjectMailTransport } from '@nesvel/nestjs-mail';
 * import type { IMailTransport, ISendMailOptions } from '@nesvel/nestjs-mail';
 * import { Process, Processor } from '@nestjs/bull';
 * import { Job } from 'bull';
 *
 * @Processor('email-queue')
 * @Injectable()
 * export class EmailQueueProcessor {
 *   private readonly logger = new Logger(EmailQueueProcessor.name);
 *
 *   constructor(
 *     @InjectMailTransport() private readonly transport: IMailTransport
 *   ) {}
 *
 *   @Process('send-email')
 *   async handleSendEmail(job: Job<ISendMailOptions>) {
 *     this.logger.log(`Processing email job ${job.id}`);
 *
 *     try {
 *       const result = await this.transport.send(job.data);
 *       this.logger.log(`Email sent successfully: ${job.id}`);
 *       return result;
 *     } catch (error: Error | any) {
 *       this.logger.error(`Failed to send email: ${job.id}`, error);
 *       throw error;
 *     }
 *   }
 * }
 * ```
 *
 * @example Transport connection manager
 * ```typescript
 * import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
 * import { InjectMailTransport } from '@nesvel/nestjs-mail';
 * import type { IMailTransport } from '@nesvel/nestjs-mail';
 *
 * @Injectable()
 * export class MailConnectionManager implements OnModuleInit, OnModuleDestroy {
 *   private readonly logger = new Logger(MailConnectionManager.name);
 *
 *   constructor(
 *     @InjectMailTransport() private readonly transport: IMailTransport
 *   ) {}
 *
 *   async onModuleInit() {
 *     try {
 *       const isConnected = await this.transport.verify();
 *
 *       if (isConnected) {
 *         this.logger.log('Mail transport connected successfully');
 *       } else {
 *         this.logger.warn('Mail transport verification failed');
 *       }
 *     } catch (error: Error | any) {
 *       this.logger.error('Failed to connect to mail transport', error);
 *     }
 *   }
 *
 *   async onModuleDestroy() {
 *     this.logger.log('Closing mail transport connections');
 *     // Perform cleanup if needed
 *   }
 * }
 * ```
 *
 * @author Nesvel
 * @since 1.0.0
 */
export function InjectMailTransport(): ParameterDecorator {
  return Inject(MAIL_TRANSPORT);
}
