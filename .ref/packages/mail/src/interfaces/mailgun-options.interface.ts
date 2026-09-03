/**
 * Mailgun Transport Options
 *
 * Configuration options for Mailgun mail transport
 *
 * @interface IMailgunOptions
 */
export interface IMailgunOptions {
  /**
   * Mailgun SMTP username
   */
  user: string;

  /**
   * Mailgun SMTP password
   */
  password: string;
}
