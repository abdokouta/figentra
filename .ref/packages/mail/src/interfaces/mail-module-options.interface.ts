import { IMailConfig } from './mail-config.interface';
import { MailQueueConfig } from './queue-config.interface';

/**
 * Mail Module Options
 *
 * Configuration options for MailModule registration
 *
 * @interface IMailModuleOptions
 */
export interface IMailModuleOptions {
  /**
   * Whether to register the module globally
   */
  isGlobal?: boolean;

  /**
   * Custom mail configuration (optional, defaults to env-based config)
   */
  config?: IMailConfig;

  /**
   * Queue configuration for asynchronous email processing
   * When provided, enables BullMQ integration
   */
  queue?: MailQueueConfig;
}
