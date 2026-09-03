import { MailTransportType } from '@enums';
import { ISESOptions } from './ses-options.interface';
import { MailerOptions } from '@nestjs-modules/mailer';
import { ISMTPOptions } from './smtp-options.interface';
import type { TailwindConfig } from '@react-email/components';
import { IMailgunOptions } from './mailgun-options.interface';
import { ISendGridOptions } from './sendgrid-options.interface';
import { IPostmarkOptions } from './postmark-options.interface';

/**
 * Mail Configuration Interface
 *
 * Extends MailerOptions from @nestjs-modules/mailer (excluding transport)
 * with custom properties for provider-specific configuration and Tailwind CSS support.
 *
 * We omit 'transport' because we use our own 'transporter' property to determine
 * which provider to use, then build the transport config internally.
 *
 * @interface IMailConfig
 * @extends {Omit<MailerOptions, 'transport'>}
 */
export interface IMailConfig extends Omit<MailerOptions, 'transport'> {
  /**
   * Mail transport provider type
   *
   * Used internally to determine which provider configuration to use
   */
  transporter?: MailTransportType;

  /**
   * Default from address
   */
  from?: string;

  /**
   * Custom Tailwind CSS configuration for email templates
   *
   * Allows customization of Tailwind theme (colors, spacing, fonts, etc.)
   * used in email templates. If not provided, uses default email-optimized configuration.
   */
  tailwindConfig?: TailwindConfig;

  /**
   * SMTP configuration (when transport is SMTP)
   */
  smtp?: ISMTPOptions;

  /**
   * AWS SES configuration (when transport is SES)
   */
  ses?: ISESOptions;

  /**
   * SendGrid configuration (when transport is SendGrid)
   */
  sendgrid?: ISendGridOptions;

  /**
   * Mailgun configuration (when transport is Mailgun)
   */
  mailgun?: IMailgunOptions;

  /**
   * Postmark configuration (when transport is Postmark)
   */
  postmark?: IPostmarkOptions;
}
