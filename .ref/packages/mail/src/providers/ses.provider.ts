import { ISESOptions } from '@interfaces/ses-options.interface';
import { IMailProvider } from '@interfaces/mail-provider.interface';

/**
 * AWS SES Mail Provider
 *
 * Implements AWS SES mail transport configuration for nodemailer
 *
 * @class SESProvider
 * @implements {IMailProvider}
 */
export class SESProvider implements IMailProvider {
  /**
   * Creates an instance of SESProvider
   *
   * @param options - SES configuration options
   */
  constructor(private readonly options: ISESOptions) {}

  /**
   * Factory method to create SES provider instance
   *
   * @param options - SES configuration options
   * @returns SESProvider instance
   */
  static make(options: ISESOptions): SESProvider {
    return new SESProvider(options);
  }

  /**
   * Get the AWS SES transport configuration
   *
   * @returns AWS SES transport configuration object
   */
  getTransportConfig(): any {
    return {
      SES: {
        ses: {
          region: this.options.region,
          accessKeyId: this.options.accessKeyId,
          secretAccessKey: this.options.secretAccessKey,
        },
        aws: {
          SendRawEmail: {},
        },
      },
    };
  }
}
