/**
 * Interface representing configuration options for the MinIO storage driver.
 *
 * This interface defines all configuration options required to connect
 * to and interact with MinIO object storage. MinIO is S3-compatible and
 * ideal for self-hosted storage solutions.
 *
 * @interface IMinIOOptions
 *
 * @example
 * ```typescript
 * const options: IMinIOOptions = {
 *   endPoint: 'localhost',
 *   port: 9000,
 *   useSSL: false,
 *   accessKey: 'minioadmin',
 *   secretKey: 'minioadmin',
 *   bucket: 'my-bucket'
 * };
 * ```
 */
export interface IMinIOOptions {
  /**
   * MinIO server endpoint (hostname or IP address).
   *
   * @example 'localhost' or 'minio.example.com'
   */
  endPoint: string;

  /**
   * MinIO server port.
   *
   * @default 9000
   */
  port?: number;

  /**
   * Whether to use SSL/TLS for connections.
   *
   * @default false
   */
  useSSL?: boolean;

  /**
   * MinIO access key (username).
   *
   * @example 'minioadmin'
   */
  accessKey: string;

  /**
   * MinIO secret key (password).
   *
   * @example 'minioadmin'
   */
  secretKey: string;

  /**
   * Name of the bucket to use for storage operations.
   *
   * @example 'my-application-bucket'
   */
  bucket: string;

  /**
   * AWS region (for S3-compatible endpoints).
   *
   * @default 'us-east-1'
   */
  region?: string;

  /**
   * Session token for temporary credentials.
   */
  sessionToken?: string;

  /**
   * Additional MinIO client configuration options.
   */
  clientOptions?: any;
}
