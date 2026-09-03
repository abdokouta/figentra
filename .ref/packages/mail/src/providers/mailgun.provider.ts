import { IMailProvider } from '@interfaces/mail-provider.interface';
import { IMailgunOptions } from '@interfaces/mailgun-options.interface';

/**
 * Mailgun Mail Provider
 *
 * Implements Mailgun mail transport configuration using SMTP
 *
 * @class MailgunProvider
 * @implements {IMailProvider}
 */
export class MailgunProvider implements IMailProvider {
  /**
   * Creates an instance of MailgunProvider
   *
   * @param options - Mailgun configuration options
   */
  constructor(private readonly options: IMailgunOptions) {}

  /**
   * Factory method to create Mailgun provider instance
   *
   * @param options - Mailgun configuration options
   * @returns MailgunProvider instance
   */
  static make(options: IMailgunOptions): MailgunProvider {
    return new MailgunProvider(options);
  }

  /**
   * Get the Mailgun transport configuration
   *
   * @returns Mailgun SMTP configuration object
   */
  getTransportConfig(): any {
    return {
      host: 'smtp.mailgun.org',
      port: 587,
      secure: false,
      auth: {
        user: this.options.user,
        pass: this.options.password,
      },
    };
  }
}
