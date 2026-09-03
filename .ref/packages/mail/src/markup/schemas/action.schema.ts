import { HttpMethod } from '@nesvel/shared';

import { IBaseMarkup } from './base-markup.schema';

/**
 * Email Action Handler Schema
 *
 * Represents an HTTP action handler
 *
 * @interface IHttpActionHandler
 */
export interface IHttpActionHandler {
  '@type': 'HttpActionHandler';

  /**
   * HTTP method
   */
  method?: HttpMethod;

  /**
   * Target URL
   */
  url: string;
}

/**
 * View Action Schema
 *
 * Represents a view/go-to action
 *
 * @interface IViewAction
 * @extends {IBaseMarkup}
 */
export interface IViewAction extends IBaseMarkup {
  '@type': 'ViewAction';

  /**
   * Action name
   */
  name: string;

  /**
   * Target URL
   */
  url?: string;

  /**
   * Action handler
   */
  handler?: IHttpActionHandler;

  /**
   * Action target
   */
  target?: string;
}

/**
 * Confirm Action Schema
 *
 * Represents a confirm action (one-click)
 *
 * @interface IConfirmAction
 * @extends {IBaseMarkup}
 */
export interface IConfirmAction extends IBaseMarkup {
  '@type': 'ConfirmAction';

  /**
   * Action name
   */
  name: string;

  /**
   * Action handler
   */
  handler: IHttpActionHandler;
}

/**
 * Save Action Schema
 *
 * Represents a save action (one-click)
 *
 * @interface ISaveAction
 * @extends {IBaseMarkup}
 */
export interface ISaveAction extends IBaseMarkup {
  '@type': 'SaveAction';

  /**
   * Action name
   */
  name: string;

  /**
   * Action handler
   */
  handler: IHttpActionHandler;
}

/**
 * RSVP Action Schema
 *
 * Represents an RSVP action
 *
 * @interface IRsvpAction
 * @extends {IBaseMarkup}
 */
export interface IRsvpAction extends IBaseMarkup {
  '@type': 'RsvpAction';

  /**
   * Action name
   */
  name: string;

  /**
   * Action handler
   */
  handler: IHttpActionHandler;

  /**
   * Attendance options
   */
  attendance?: 'Yes' | 'No' | 'Maybe';
}
