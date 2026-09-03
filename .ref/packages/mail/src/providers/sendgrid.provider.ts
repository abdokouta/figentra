import { IMailProvider } from '@interfaces/mail-provider.interface';
import { ISendGridOptions } from '@interfaces/sendgrid-options.interface';

/**
 * SendGrid Mail Provider
 *
 * Implements SendGrid mail transport configuration using SMTP
 *
 * @class SendGridProvider
 * @implements {IMailProvider}
 */
export class SendGridProvider implements IMailProvider {
  /**
   * Creates an instance of SendGridProvider
   *
   * @param options - SendGrid configuration options
   */
  constructor(private readonly options: ISendGridOptions) {}

  /**
   * Factory method to create SendGrid provider instance
   *
   * @param options - SendGrid configuration options
   * @returns SendGridProvider instance
   */
  static make(options: ISendGridOptions): SendGridProvider {
    return new SendGridProvider(options);
  }

  /**
   * Get the SendGrid transport configuration
   *
   * @returns SendGrid SMTP connection string
   */
  getTransportConfig(): string {
    return `smtps://apikey:${this.options.apiKey}@smtp.sendgrid.net:465`;
  }
}
