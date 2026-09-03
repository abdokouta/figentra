/**
 * AWS SES Transport Options
 *
 * Configuration options for AWS SES mail transport
 *
 * @interface ISESOptions
 */
export interface ISESOptions {
  /**
   * AWS region
   */
  region: string;

  /**
   * AWS access key ID
   */
  accessKeyId: string;

  /**
   * AWS secret access key
   */
  secretAccessKey: string;
}
