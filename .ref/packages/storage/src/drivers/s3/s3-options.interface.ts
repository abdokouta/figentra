/**
 * Interface representing configuration options for the S3 storage driver.
 *
 * This interface defines all configuration options required to connect
 * to and interact with Amazon S3 or S3-compatible storage services.
 *
 * @interface IS3Options
 *
 * @example
 * ```typescript
 * const options: IS3Options = {
 *   region: 'us-east-1',
 *   bucket: 'my-bucket',
 *   credentials: {
 *     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
 *     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
 *   }
 * };
 * ```
 */
export interface IS3Options {
  /**
   * AWS region where the S3 bucket is located.
   *
   * @example 'us-east-1'
   */
  region: string;

  /**
   * Name of the S3 bucket to use for storage operations.
   *
   * @example 'my-application-bucket'
   */
  bucket: string;

  /**
   * AWS credentials for authentication.
   */
  credentials?: {
    /**
     * AWS access key ID.
     */
    accessKeyId: string;

    /**
     * AWS secret access key.
     */
    secretAccessKey: string;

    /**
     * Optional session token for temporary credentials.
     */
    sessionToken?: string;
  };

  /**
   * Custom endpoint URL for S3-compatible services.
   * Leave undefined to use standard AWS S3 endpoints.
   *
   * @example 'https://s3.custom-provider.com'
   */
  endpoint?: string;

  /**
   * Whether to force path-style URLs instead of virtual-hosted-style.
   * Required for some S3-compatible services.
   *
   * @default false
   */
  forcePathStyle?: boolean;

  /**
   * Whether to use SSL/TLS for connections.
   *
   * @default true
   */
  useSSL?: boolean;

  /**
   * Additional S3 client configuration options.
   * These are passed directly to the AWS SDK S3 client.
   */
  clientOptions?: any;
}
