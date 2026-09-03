import { IMailProvider } from '@interfaces/mail-provider.interface';
import { IPostmarkOptions } from '@interfaces/postmark-options.interface';

/**
 * Postmark Mail Provider
 *
 * Implements Postmark mail transport configuration using SMTP
 *
 * @class PostmarkProvider
 * @implements {IMailProvider}
 */
export class PostmarkProvider implements IMailProvider {
  /**
   * Creates an instance of PostmarkProvider
   *
   * @param options - Postmark configuration options
   */
  constructor(private readonly options: IPostmarkOptions) {}

  /**
   * Factory method to create Postmark provider instance
   *
   * @param options - Postmark configuration options
   * @returns PostmarkProvider instance
   */
  static make(options: IPostmarkOptions): PostmarkProvider {
    return new PostmarkProvider(options);
  }

  /**
   * Get the Postmark transport configuration
   *
   * @returns Postmark SMTP connection string
   */
  getTransportConfig(): string {
    return `smtps://apikey:${this.options.apiToken}@smtp.postmarkapp.com:587`;
  }
}
