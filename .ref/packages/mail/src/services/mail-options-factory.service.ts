import { Injectable, Logger } from '@nestjs/common';
import { MailerOptions } from '@nestjs-modules/mailer';

import { ReactAdapter } from '@adapters';
import { IMailConfig } from '@interfaces';
import { MailFactoryService } from './mail-factory.service';

/**
 * Mail Options Factory Service
 *
 * Converts IMailConfig to MailerOptions format compatible with @nestjs-modules/mailer
 *
 * This service acts as a bridge between our custom configuration format and the
 * @nestjs-modules/mailer package requirements, ensuring seamless integration.
 *
 * @class MailOptionsFactoryService
 */
@Injectable()
export class MailOptionsFactoryService {
  private readonly logger = new Logger(MailOptionsFactoryService.name);

  /**
   * Creates an instance of MailService
   *
   * @param mailFactory - MailFactoryService instance
   */
  constructor(private readonly mailFactory: MailFactoryService) {}

  /**
   * Creates MailerOptions from IMailConfig
   *
   * This method:
   * - Converts our custom config format to @nestjs-modules/mailer format
   * - Uses factory to create the appropriate transport provider if transporter is specified
   * - Passes through all MailerOptions properties (template, preview, etc.)
   * - Sets up default adapter if not provided
   *
   * @param config - The mail configuration
   * @returns MailerOptions compatible with @nestjs-modules/mailer
   */
  createMailOptions(config: IMailConfig): MailerOptions {
    // Build base options from config (IMailConfig extends MailerOptions)
    const options: MailerOptions = {
      ...config,
    };

    // If transporter is specified, use factory to create transport
    if (config.transporter) {
      const provider = this.mailFactory.createDriver(config);
      options.transport = provider.getTransportConfig();
    }

    // Set defaults.from if provided
    if (config.from) {
      options.defaults = {
        ...options.defaults,
        from: config.from,
      };
    }

    // Set default adapter if no adapter is provided
    if (!config.template?.adapter) {
      options.template = {
        ...config.template,
        adapter: ReactAdapter.make({
          pretty: process.env.NODE_ENV === 'development',
          plainText: true, // Generate plain text version for email client compatibility
        }),
        options: {
          strict: true,
          ...config.template?.options,
        },
      };
    }

    return options;
  }
}
