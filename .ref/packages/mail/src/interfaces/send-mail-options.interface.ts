import { ISendMailOptions } from '@nestjs-modules/mailer';

import { EmailPriority } from '../enums';
import { IBaseMarkup } from '../markup/schemas';
import { BaseMarkupBuilder } from '../markup/builders/base-markup.builder';

/**
 * Email Send Options
 *
 * Extended options for sending emails with additional features
 * beyond the base ISendMailOptions from @nestjs-modules/mailer
 *
 * @interface ISendMailOptions
 * @extends {ISendMailOptions}
 */
export interface SendMailOptions extends ISendMailOptions {
  /**
   * Email template name
   */
  template?: string;

  /**
   * Template context data
   */
  context?: Record<string, any>;

  /**
   * Email priority level
   */
  priority?: EmailPriority;

  /**
   * Track email opens (requires tracking service)
   */
  trackOpens?: boolean;

  /**
   * Track link clicks (requires tracking service)
   */
  trackClicks?: boolean;

  /**
   * Custom headers
   */
  headers?: Record<string, string>;

  /**
   * Gmail structured data markup (single or multiple)
   */
  markup?:
    | BaseMarkupBuilder<IBaseMarkup>
    | BaseMarkupBuilder<IBaseMarkup>[]
    | IBaseMarkup
    | IBaseMarkup[];
}
