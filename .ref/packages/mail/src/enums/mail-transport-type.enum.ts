/**
 * Mail Transport Type Enum
 *
 * Supported mail transport providers
 *
 * @enum MailTransportType
 */
export enum MailTransportType {
  /**
   * SMTP
   */
  SMTP = 'smtp',

  /**
   * SES
   */
  SES = 'ses',

  /**
   * SENDGRID
   */
  SENDGRID = 'sendgrid',

  /**
   * MAILGUN
   */
  MAILGUN = 'mailgun',

  /**
   * POSTMARK
   */
  POSTMARK = 'postmark',
}
