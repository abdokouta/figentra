import { Injectable } from '@nestjs/common';
import { BaseFactory } from '@nesvel/shared';

import {
  SMTPProvider,
  SESProvider,
  SendGridProvider,
  MailgunProvider,
  PostmarkProvider,
} from '@providers';
import { MailTransportType } from '@enums';
import { TransportNotFoundException } from '@exceptions';
import { IMailProvider, IMailConfig } from '@interfaces';

/**
 * Factory service for creating and configuring mail transport provider instances.
 *
 * This service extends BaseFactory to provide a standardized factory pattern for
 * creating email transport provider instances. It manages the lifecycle and
 * configuration of various email delivery services including SMTP, AWS SES,
 * SendGrid, Mailgun, and Postmark.
 *
 * Architecture:
 * - Extends BaseFactory with mail-specific configuration handling
 * - Maintains a registry of available email transport providers
 * - Provides transport-specific validation and instantiation
 * - Configures provider-specific options (API keys, SMTP credentials, etc.)
 * - Supports custom provider registration at runtime
 *
 * Supported Transport Providers:
 * - SMTP: Traditional email server protocol for self-hosted solutions
 *   - Flexible configuration for any SMTP server
 *   - Support for secure connections (TLS/SSL)
 *   - Authentication options
 *
 * - AWS SES: Amazon Simple Email Service for scalable sending
 *   - High deliverability rates
 *   - Cost-effective for bulk sending
 *   - AWS infrastructure reliability
 *
 * - SendGrid: Cloud-based email delivery platform
 *   - Advanced analytics and reporting
 *   - Template management
 *   - Marketing and transactional emails
 *
 * - Mailgun: Developer-focused email API service
 *   - Powerful API and SMTP options
 *   - Email validation and verification
 *   - Detailed logs and analytics
 *
 * - Postmark: Transactional email specialist
 *   - Fast delivery focused on transactional emails
 *   - Detailed delivery tracking
 *   - Excellent deliverability rates
 *
 * Key Features:
 * - Automatic provider instantiation with transport configuration
 * - Transport-specific option validation
 * - Support for both API and SMTP-based providers
 * - Type-safe operations with full TypeScript support
 * - Comprehensive error handling with missing configuration detection
 *
 * @extends BaseFactory<IMailConfig, IMailProvider, any>
 *
 * @example
 * Basic usage with SMTP:
 * ```typescript
 * const provider = mailFactory.createDriver({
 *   transporter: MailTransportType.SMTP,
 *   smtp: {
 *     host: 'smtp.gmail.com',
 *     port: 587,
 *     secure: false,
 *     auth: {
 *       user: 'your-email@gmail.com',
 *       pass: 'your-app-password'
 *     }
 *   }
 * });
 *
 * await provider.send({
 *   from: 'sender@example.com',
 *   to: 'recipient@example.com',
 *   subject: 'Hello',
 *   html: '<p>Email content</p>'
 * });
 * ```
 *
 * @example
 * Using SendGrid API:
 * ```typescript
 * const provider = mailFactory.createDriver({
 *   transporter: MailTransportType.SENDGRID,
 *   sendgrid: {
 *     apiKey: process.env.SENDGRID_API_KEY
 *   }
 * });
 *
 * // Send with SendGrid templates
 * await provider.send({
 *   to: 'user@example.com',
 *   templateId: 'd-123abc',
 *   dynamicTemplateData: {
 *     name: 'John',
 *     confirmationUrl: 'https://...'
 *   }
 * });
 * ```
 *
 * @example
 * Using AWS SES:
 * ```typescript
 * const provider = mailFactory.createDriver({
 *   transporter: MailTransportType.SES,
 *   ses: {
 *     region: 'us-east-1',
 *     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
 *     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
 *   }
 * });
 * ```
 *
 * @example
 * Registering a custom mail provider:
 * ```typescript
 * class CustomMailProvider implements IMailProvider {
 *   static make(options: any) {
 *     return CustomMailProvider.make(options);
 *   }
 *   async send(message: IMailMessage): Promise<void> { ... }
 *   getTransportConfig() { ... }
 * }
 *
 * mailFactory.registerDriver('custom', CustomMailProvider);
 * const provider = mailFactory.createDriver({
 *   transporter: 'custom',
 *   custom: { apiKey: '...' }
 * });
 * ```
 *
 * @see {@link BaseFactory} For base factory implementation
 * @see {@link IMailProvider} For provider interface specification
 * @see {@link IMailConfig} For configuration options
 *
 * @author Nesvel
 * @since 1.0.0
 */
@Injectable()
export class MailFactoryService extends BaseFactory<IMailConfig, IMailProvider, any> {
  /**
   * Registry of available email transport providers.
   *
   * Maps transport type identifiers to their corresponding provider classes.
   * This registry is used by BaseFactory to instantiate the appropriate
   * mail provider based on configuration.
   *
   * Available providers:
   * - SES: Amazon Simple Email Service (AWS)
   * - SMTP: Traditional email server protocol
   * - MAILGUN: Mailgun email API service
   * - SENDGRID: SendGrid cloud email platform
   * - POSTMARK: Postmark transactional email service
   *
   * @protected
   * @readonly
   */
  protected readonly driverRegistry = new Map<string, any>([
    [MailTransportType.SES, SESProvider],
    [MailTransportType.SMTP, SMTPProvider],
    [MailTransportType.MAILGUN, MailgunProvider],
    [MailTransportType.SENDGRID, SendGridProvider],
    [MailTransportType.POSTMARK, PostmarkProvider],
  ]);

  /**
   * Extracts the email transporter type from configuration.
   *
   * Determines which email transport provider should be used based on the
   * provided configuration. The transporter type determines the email delivery
   * method (SMTP server, AWS SES, SendGrid API, etc.).
   *
   * If no transporter is specified, defaults to SMTP as the fallback transport method.
   *
   * @param config - The mail configuration object containing transporter selection
   * @returns The transporter type identifier (e.g., 'smtp', 'ses', 'sendgrid', 'mailgun', 'postmark')
   *
   * @protected
   * @override Implementation of BaseFactory abstract method
   *
   * @example
   * ```typescript
   * const type = this.getDriverType({ transporter: MailTransportType.SMTP });
   * // Returns: 'smtp'
   *
   * const sesType = this.getDriverType({ transporter: MailTransportType.SES });
   * // Returns: 'ses'
   *
   * const defaultType = this.getDriverType({});
   * // Returns: 'smtp' (default)
   * ```
   */
  protected getDriverType(config: IMailConfig): string {
    return config.transporter || MailTransportType.SMTP;
  }

  /**
   * Gets provider-specific configuration options.
   *
   * Extracts and returns the configuration options specific to the selected
   * email transport provider. Each provider has its own set of configurable
   * parameters:
   *
   * - SMTP: host, port, secure, auth (username/password), etc.
   * - SES: region, accessKeyId, secretAccessKey, etc.
   * - SendGrid: apiKey, etc.
   * - Mailgun: apiKey, domain, etc.
   * - Postmark: serverToken, etc.
   *
   * This method validates that required configuration exists and throws
   * descriptive errors if it's missing.
   *
   * @param config - The mail configuration containing provider-specific options
   * @returns Provider-specific configuration options, or undefined for custom providers
   *
   * @throws {Error} If required provider-specific configuration is missing
   *
   * @protected
   * @override Implementation of BaseFactory abstract method
   *
   * @example
   * ```typescript
   * const smtpOpts = this.getDriverOptions({
   *   transporter: MailTransportType.SMTP,
   *   smtp: { host: 'smtp.gmail.com', port: 587 }
   * });
   * // Returns: { host: 'smtp.gmail.com', port: 587 }
   *
   * const sesOpts = this.getDriverOptions({
   *   transporter: MailTransportType.SES,
   *   ses: { region: 'us-east-1', accessKeyId: 'KEY', secretAccessKey: 'SECRET' }
   * });
   * // Returns: { region: 'us-east-1', accessKeyId: 'KEY', secretAccessKey: 'SECRET' }
   * ```
   */
  protected getDriverOptions(config: IMailConfig): any {
    switch (config.transporter) {
      case MailTransportType.SMTP:
        /**
         * SMTP transport options extraction.
         * Validates that SMTP configuration exists and returns it.
         * SMTP options typically include: host, port, secure, auth (user, pass), etc.
         */
        if (!config.smtp) {
          throw new Error('SMTP options are required when transport is SMTP');
        }
        return config.smtp;

      case MailTransportType.SES:
        /**
         * AWS SES transport options extraction.
         * Validates that SES configuration exists and returns it.
         * SES options typically include: region, accessKeyId, secretAccessKey, etc.
         */
        if (!config.ses) {
          throw new Error('SES options are required when transport is SES');
        }
        return config.ses;

      case MailTransportType.SENDGRID:
        /**
         * SendGrid transport options extraction.
         * Validates that SendGrid configuration exists and returns it.
         * SendGrid options typically include: apiKey
         */
        if (!config.sendgrid) {
          throw new Error('SendGrid options are required when transport is SendGrid');
        }
        return config.sendgrid;

      case MailTransportType.MAILGUN:
        /**
         * Mailgun transport options extraction.
         * Validates that Mailgun configuration exists and returns it.
         * Mailgun options typically include: apiKey, domain, etc.
         */
        if (!config.mailgun) {
          throw new Error('Mailgun options are required when transport is Mailgun');
        }
        return config.mailgun;

      case MailTransportType.POSTMARK:
        /**
         * Postmark transport options extraction.
         * Validates that Postmark configuration exists and returns it.
         * Postmark options typically include: serverToken
         */
        if (!config.postmark) {
          throw new Error('Postmark options are required when transport is Postmark');
        }
        return config.postmark;

      default:
        /**
         * Custom or unsupported transporter.
         * Returns undefined for custom providers that may not have
         * predefined configuration structure.
         */
        return undefined;
    }
  }

  /**
   * Instantiates a mail provider with the provided options.
   *
   * Creates a new instance of the specified mail provider class using the
   * static make() factory method. All mail providers implement this method
   * for consistent instantiation.
   *
   * The provider encapsulates the underlying mail transport mechanism,
   * providing a consistent interface for sending emails regardless of
   * the transport type (SMTP, AWS SES, SendGrid, etc.).
   *
   * @param ProviderClass - The provider class constructor (SMTPProvider, SESProvider, etc.)
   * @param options - Provider-specific configuration (API keys, SMTP settings, etc.)
   * @returns A fully configured mail provider instance ready to send emails
   *
   * @protected
   * @override Implementation of BaseFactory abstract method
   *
   * @example
   * ```typescript
   * const provider = this.instantiateDriver(
   *   SMTPProvider,
   *   { host: 'smtp.gmail.com', port: 587, auth: {...} }
   * );
   * // Returns: SMTPProvider instance ready to send emails
   *
   * const sesProvider = this.instantiateDriver(
   *   SESProvider,
   *   { region: 'us-east-1', accessKeyId: 'KEY', secretAccessKey: 'SECRET' }
   * );
   * // Returns: SESProvider instance configured with AWS credentials
   * ```
   */
  protected instantiateDriver(ProviderClass: any, options: any): IMailProvider {
    return ProviderClass.make(options);
  }

  /**
   * Creates the appropriate error for unsupported transporter.
   *
   * Generates a custom TransportNotFoundException when a requested email
   * transporter is not found in the provider registry. This error provides
   * helpful information about the invalid transporter and lists all available
   * transporters.
   *
   * @param transporter - The requested transporter identifier that wasn't found in the registry
   * @param availableTransporters - List of all available transporter types for helpful error message
   * @returns A TransportNotFoundException instance with descriptive error message
   *
   * @protected
   * @override Implementation of BaseFactory abstract method
   *
   * @example
   * ```typescript
   * const error = this.getNotFoundError('unknown-mail', ['smtp', 'ses', 'sendgrid', 'mailgun', 'postmark']);
   * // Returns: TransportNotFoundException with message:
   * // "Mail transporter 'unknown-mail' not found. Available: smtp, ses, sendgrid, mailgun, postmark"
   * ```
   */
  protected getNotFoundError(transporter: string, availableTransporters: string[]): Error {
    return TransportNotFoundException.make(transporter, availableTransporters);
  }
}
