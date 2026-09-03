import { SentMessageInfo } from 'nodemailer';
import { Injectable, Logger } from '@nestjs/common';
import { ISendMailOptions } from '@nestjs-modules/mailer';
import { MailerService as NestMailService } from '@nestjs-modules/mailer';

import { IBaseMarkup } from '@markup/schemas';
import { SendMailOptions } from '@interfaces';
import { BaseMarkupBuilder } from '@markup/builders';
import { EmailPriority, EmailPriorityHeader } from '@enums';
import { PendingMail, Mailable, Address } from '../classes';

/**
 * MailService
 *
 * Enhanced email service with additional features and better type safety.
 *
 * Provides a wrapper around @nestjs-modules/mailer with:
 * - Comprehensive logging
 * - Priority email support
 * - Batch email sending
 * - Transactional and marketing email helpers
 * - Gmail structured data markup support
 * - Error handling and retry logic
 *
 * @class MailService
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class AuthService {
 *   constructor(private readonly mailService: MailService) {}
 *
 *   async sendVerificationEmail(user: User, token: string) {
 *     await this.mailService.sendMail({
 *       to: user.email,
 *       subject: 'Verify your email',
 *       template: 'verify-email',
 *       context: {
 *         name: user.name,
 *         verificationUrl: `${config.appUrl}/verify?token=${token}`,
 *       },
 *     });
 *   }
 *
 *   async sendPasswordResetEmail(user: User, resetToken: string) {
 *     await this.mailService.sendMail({
 *       to: user.email,
 *       subject: 'Reset your password',
 *       template: 'reset-password',
 *       context: {
 *         name: user.name,
 *         resetUrl: `${config.appUrl}/reset-password?token=${resetToken}`,
 *       },
 *       priority: EmailPriority.HIGH,
 *     });
 *   }
 * }
 * ```
 */
@Injectable()
export class MailService {
  /**
   * Logger instance for email service operations
   */
  private readonly logger = new Logger(MailService.name);

  /**
   * Queue service instance (optional)
   */
  private queueService?: any;

  /**
   * Creates an instance of MailService
   *
   * @param nestMailService - NestMailService instance
   */
  constructor(private readonly nestMailService: NestMailService) {}

  /**
   * Set queue service for async email processing
   * @internal
   */
  public setQueueService(queueService: any): void {
    this.queueService = queueService;
  }

  /**
   * Send an email
   *
   * @param options - Email send options
   * @returns Sent message info from nodemailer
   * @throws Error if email sending fails
   */
  async sendMail(options: SendMailOptions): Promise<SentMessageInfo> {
    try {
      // Log email sending attempt (without sensitive data)
      this.logger.log(
        `Sending email to ${options.to} with subject "${options.subject}"${options.template ? ` using template "${options.template}"` : ''}`,
      );

      // Process markup if provided
      const markupScript = options.markup ? this.processMarkup(options.markup) : undefined;

      // Add custom headers if provided
      const headers = {
        ...options.headers,
        ...(options.priority && { 'X-Priority': this.getPriorityValue(options.priority) }),
      };

      // Prepare context with markup
      const context = {
        ...options.context,
        ...(markupScript && { markupScript }),
      };

      // Prepare final email options
      const mailOptions: ISendMailOptions = {
        ...options,
        context,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
      };

      // Remove custom fields that shouldn't be passed to nodemailer
      delete (mailOptions as any).markup;
      delete (mailOptions as any).priority;
      delete (mailOptions as any).trackOpens;
      delete (mailOptions as any).trackClicks;

      // Send email using nest mail service
      const result = await this.nestMailService.sendMail(mailOptions);

      // Log success
      this.logger.log(`Email sent successfully to ${options.to}`);

      return result;
    } catch (error: Error | any) {
      // Log error with details
      this.logger.error(`Failed to send email to ${options.to}: ${error.message}`, error.stack);

      // Re-throw error for caller to handle
      throw error;
    }
  }

  /**
   * Send email to multiple recipients
   *
   * @param recipients - Array of recipient email addresses
   * @param options - Email send options (excluding 'to')
   * @returns Array of sent message info
   */
  async sendMailToMany(
    recipients: string[],
    options: Omit<SendMailOptions, 'to'>,
  ): Promise<SentMessageInfo[]> {
    this.logger.log(`Sending email to ${recipients.length} recipients`);

    // Send emails in parallel
    const results = await Promise.allSettled(
      recipients.map((to) =>
        this.sendMail({
          ...options,
          to,
        }),
      ),
    );

    // Separate successful and failed sends
    const successful = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');

    // Log results
    this.logger.log(`Sent ${successful.length}/${recipients.length} emails successfully`);

    if (failed.length > 0) {
      this.logger.warn(`Failed to send ${failed.length} emails`);
    }

    // Return successful results
    return successful.map((r) => (r as PromiseFulfilledResult<SentMessageInfo>).value);
  }

  /**
   * Send transactional email (alias for sendMail with high priority)
   *
   * @param options - Email send options
   * @returns Sent message info
   */
  async sendTransactionalEmail(
    options: Omit<SendMailOptions, 'priority'>,
  ): Promise<SentMessageInfo> {
    return this.sendMail({
      ...options,
      priority: EmailPriority.HIGH,
    });
  }

  /**
   * Send marketing/promotional email
   *
   * @param options - Email send options
   * @returns Sent message info
   */
  async sendMarketingEmail(options: Omit<SendMailOptions, 'priority'>): Promise<SentMessageInfo> {
    return this.sendMail({
      ...options,
      priority: EmailPriority.LOW,
    });
  }

  /**
   * Process markup into HTML script tags
   *
   * Converts markup builders or JSON objects into JSON-LD script tags
   * that can be embedded in email HTML
   *
   * @param markup - Single or multiple markup builders/objects
   * @returns HTML script tags containing JSON-LD markup
   *
   * @private
   */
  private processMarkup(
    markup:
      | BaseMarkupBuilder<IBaseMarkup>
      | BaseMarkupBuilder<IBaseMarkup>[]
      | IBaseMarkup
      | IBaseMarkup[],
  ): string {
    // Convert to array if single item
    const markups = Array.isArray(markup) ? markup : [markup];

    // Process each markup
    const scripts = markups.map((m) => {
      // If it's a builder, get the script tag
      if (m instanceof BaseMarkupBuilder) {
        return m.toScriptTag();
      }

      // If it's a plain object, wrap in script tag
      return `<script type="application/ld+json">\n${JSON.stringify(m, null, 2)}\n</script>`;
    });

    // Join all scripts with newlines
    return scripts.join('\n');
  }

  /**
   * Get priority value for email headers
   *
   * Converts EmailPriority enum to X-Priority header value
   * per RFC 2156 (1 = highest, 5 = lowest)
   *
   * @param priority - Email priority level
   * @returns Priority header value (1, 3, or 5)
   *
   * @private
   */
  private getPriorityValue(priority: EmailPriority): string {
    const priorityMap: Record<EmailPriority, EmailPriorityHeader> = {
      [EmailPriority.LOW]: EmailPriorityHeader.LOW,
      [EmailPriority.HIGH]: EmailPriorityHeader.HIGH,
      [EmailPriority.NORMAL]: EmailPriorityHeader.NORMAL,
    };
    return priorityMap[priority];
  }

  // ============================================================================
  // Fluent API Methods (Laravel-inspired)
  // ============================================================================

  /**
   * Begin building an email with to recipients (fluent API)
   *
   * @param users - Email address(es) or user object(s)
   * @returns PendingMail instance for chaining
   *
   * @example
   * ```typescript
   * await mailService
   *   .to('user@example.com')
   *   .send(OrderShipped.make(order));
   *
   * await mailService
   *   .to(user) // Auto-detects locale from user.preferredLocale()
   *   .queue(Welcome.make(user));
   * ```
   */
  public to(users: string | Address | any | Array<string | Address | any>): PendingMail {
    return PendingMail.make(this).to(users);
  }

  /**
   * Begin building an email with cc recipients (fluent API)
   *
   * @param users - Email address(es) or user object(s)
   * @returns PendingMail instance for chaining
   */
  public cc(users: string | Address | any | Array<string | Address | any>): PendingMail {
    return PendingMail.make(this).cc(users);
  }

  /**
   * Begin building an email with bcc recipients (fluent API)
   *
   * @param users - Email address(es) or user object(s)
   * @returns PendingMail instance for chaining
   */
  public bcc(users: string | Address | any | Array<string | Address | any>): PendingMail {
    return PendingMail.make(this).bcc(users);
  }

  /**
   * Send a mailable immediately
   *
   * @param mailable - Mailable instance to send
   * @returns Sent message info
   * @internal Used by PendingMail
   */
  public async sendMailable(mailable: Mailable): Promise<SentMessageInfo> {
    // Build the mailable
    mailable.build();

    // Convert to mail data
    const mailData = mailable.toMailData();

    // Prepare send options
    const options: SendMailOptions = {
      to: mailData.to.length > 0 ? mailData.to.join(', ') : undefined,
      cc: mailData.cc.length > 0 ? mailData.cc.join(', ') : undefined,
      bcc: mailData.bcc.length > 0 ? mailData.bcc.join(', ') : undefined,
      from: mailData.from,
      replyTo: mailData.replyTo.length > 0 ? mailData.replyTo.join(', ') : undefined,
      subject: mailData.subject,
      template: mailData.template,
      context: {
        ...mailData.context,
        ...(mailData.locale && { _locale: mailData.locale }),
      },
      attachments: mailData.attachments,
      headers: mailData.headers,
    };

    // Send using existing sendMail method
    return this.sendMail(options as any);
  }

  /**
   * Queue a mailable for async processing
   *
   * @param mailable - Mailable instance to queue
   * @returns Job ID or confirmation
   * @internal Used by PendingMail
   */
  public async queueMailable(mailable: Mailable): Promise<any> {
    if (!this.queueService) {
      this.logger.warn('Queue service not configured, sending email synchronously instead');
      return this.sendMailable(mailable);
    }

    // Queue the mailable
    const queueConfig = mailable.getQueueConfig();
    return this.queueService.addMailJob(mailable, queueConfig);
  }
}
