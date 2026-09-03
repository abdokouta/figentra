/**
 * SMTP Transport Options
 *
 * Configuration options for SMTP mail transport
 *
 * @interface ISMTPOptions
 */
export interface ISMTPOptions {
  /**
   * SMTP server hostname
   */
  host: string;

  /**
   * SMTP server port
   */
  port: number;

  /**
   * Use TLS/SSL
   */
  secure: boolean;

  /**
   * Authentication credentials
   */
  auth?: {
    user: string;
    pass: string;
  };

  /**
   * TLS options
   */
  tls?: {
    rejectUnauthorized: boolean;
  };
}
