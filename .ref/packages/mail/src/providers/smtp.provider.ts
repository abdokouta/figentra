import { ISMTPOptions } from '@interfaces/smtp-options.interface';
import { IMailProvider } from '@interfaces/mail-provider.interface';

/**
 * SMTP Mail Provider
 *
 * Implements SMTP mail transport configuration for nodemailer
 *
 * @class SMTPProvider
 * @implements {IMailProvider}
 */
export class SMTPProvider implements IMailProvider {
  /**
   * Creates an instance of SMTPProvider
   *
   * @param options - SMTP configuration options
   */
  constructor(private readonly options: ISMTPOptions) {}

  /**
   * Factory method to create SMTP provider instance
   *
   * @param options - SMTP configuration options
   * @returns SMTPProvider instance
   */
  static make(options: ISMTPOptions): SMTPProvider {
    return new SMTPProvider(options);
  }

  /**
   * Get the SMTP transport configuration
   *
   * @returns SMTP transport configuration object
   */
  getTransportConfig(): any {
    return {
      host: this.options.host,
      port: this.options.port,
      secure: this.options.secure,
      auth: this.options.auth,
      tls: this.options.tls,
    };
  }
}
