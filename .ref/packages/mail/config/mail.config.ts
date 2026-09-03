import * as path from 'path';

import { MailTransportType } from '@enums';
import { IMailModuleOptions } from '@interfaces';

/**
 * Mail Module Configuration
 *
 * Production-ready email configuration for NestJS.
 * Provides comprehensive email integration with multiple transport providers.
 *
 * Features:
 * - Multi-transport support (SMTP, SES, SendGrid, Mailgun, Postmark)
 * - Template support with React adapter
 * - Type-safe operations
 * - Environment-based configuration
 *
 * All configuration values can be overridden via environment variables.
 *
 * @see {@link https://nodemailer.com | Nodemail}
 * @see {@link https://sendgrid.com/docs | SendGrid}
 * @see {@link https://docs.aws.amazon.com/ses | AWS SES}
 * @see {@link https://documentation.mailgun.com | Mailgun}
 * @see {@link https://postmarkapp.com/developer | Postmark}
 *
 * @example
 * ```typescript
 * // Access configuration values
 * const transport = mailConfig.transport;
 * const from = mailConfig.from;
 * const smtpHost = mailConfig.smtp?.host;
 * ```
 */
export const mailConfig: IMailModuleOptions = {
  isGlobal: true,
  config: {
    /**
     * Mail transport provider type
     *
     * Determines which email service to use.
     * Options: SMTP, SES, SENDGRID, MAILGUN, POSTMARK
     *
     * @env MAIL_TRANSPORT
     * @default MailTransportType.SMTP
     */
    transporter: (process.env.MAIL_TRANSPORT as MailTransportType) || MailTransportType.SMTP,

    /**
     * Default 'from' address for emails
     *
     * Format: "Name" <email@example.com> or just email@example.com
     *
     * @env MAIL_FROM
     * @default "No Reply" <noreply@example.com>
     */
    from: process.env.MAIL_FROM || '"No Reply" <noreply@example.com>',

    /**
     * Template configuration
     *
     * @env MAIL_TEMPLATE_DIR
     * @default ../templates/emails (relative to this config file)
     */
    template: {
      dir: process.env.MAIL_TEMPLATE_DIR
        ? path.isAbsolute(process.env.MAIL_TEMPLATE_DIR)
          ? process.env.MAIL_TEMPLATE_DIR
          : path.join(process.cwd(), process.env.MAIL_TEMPLATE_DIR)
        : path.join(__dirname, '../templates/emails'),
    },

    /**
     * Enable email preview in development
     *
     * When true, opens sent emails in browser (development only)
     *
     * @env MAIL_PREVIEW
     * @default true in development, false in production
     */
    preview: process.env.MAIL_PREVIEW === 'true' || process.env.NODE_ENV === 'development',

    /**
     * Tailwind CSS Configuration
     *
     * Custom Tailwind configuration for email templates.
     * If not provided, uses the default email-optimized configuration
     * from the TailwindProvider (defaultTailwindConfig).
     *
     * You can customize colors, spacing, fonts, and other design tokens.
     *
     * @default undefined (uses defaultTailwindConfig)
     *
     * @example
     * ```typescript
     * tailwindConfig: {
     *   theme: {
     *     extend: {
     *       colors: {
     *         brand: '#ff6b6b',
     *         accent: '#4ecdc4',
     *       },
     *     },
     *   },
     * }
     * ```
     */
    tailwindConfig: undefined,

    /**
     * SMTP Configuration
     *
     * Used when transport is set to MailTransportType.SMTP
     *
     * @env MAIL_HOST - SMTP server hostname
     * @env MAIL_PORT - SMTP server port
     * @env MAIL_SECURE - Use TLS/SSL
     * @env MAIL_USER - SMTP username
     * @env MAIL_PASSWORD - SMTP password
     * @env MAIL_TLS_REJECT_UNAUTHORIZED - Reject unauthorized TLS certificates
     */
    smtp: {
      host: process.env.MAIL_HOST || 'localhost',
      port: parseInt(process.env.MAIL_PORT || '1025', 10),
      secure: process.env.MAIL_SECURE === 'true',
      auth: process.env.MAIL_USER
        ? {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASSWORD || '',
          }
        : undefined,
      tls: {
        rejectUnauthorized: process.env.MAIL_TLS_REJECT_UNAUTHORIZED !== 'false',
      },
    },

    /**
     * AWS SES Configuration
     *
     * Used when transport is set to MailTransportType.SES
     *
     * @env AWS_REGION - AWS region
     * @env AWS_ACCESS_KEY_ID - AWS access key ID
     * @env AWS_SECRET_ACCESS_KEY - AWS secret access key
     */
    ses: process.env.AWS_ACCESS_KEY_ID
      ? {
          region: process.env.AWS_REGION || 'us-east-1',
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        }
      : undefined,

    /**
     * SendGrid Configuration
     *
     * Used when transport is set to MailTransportType.SENDGRID
     *
     * @env SENDGRID_API_KEY - SendGrid API key
     */
    sendgrid: process.env.SENDGRID_API_KEY
      ? {
          apiKey: process.env.SENDGRID_API_KEY,
        }
      : undefined,

    /**
     * Mailgun Configuration
     *
     * Used when transport is set to MailTransportType.MAILGUN
     *
     * @env MAILGUN_USER - Mailgun SMTP username
     * @env MAILGUN_PASSWORD - Mailgun SMTP password
     */
    mailgun: process.env.MAILGUN_USER
      ? {
          user: process.env.MAILGUN_USER,
          password: process.env.MAILGUN_PASSWORD || '',
        }
      : undefined,

    /**
     * Postmark Configuration
     *
     * Used when transport is set to MailTransportType.POSTMARK
     *
     * @env POSTMARK_API_TOKEN - Postmark API token
     */
    postmark: process.env.POSTMARK_API_TOKEN
      ? {
          apiToken: process.env.POSTMARK_API_TOKEN,
        }
      : undefined,
  },
};
