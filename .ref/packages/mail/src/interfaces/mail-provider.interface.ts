/**
 * Mail Provider Interface
 *
 * Base interface for all mail transport providers
 *
 * @interface IMailProvider
 */
export interface IMailProvider {
  /**
   * Get the transport configuration for nodemailer
   *
   * @returns Transport configuration object or connection string
   */
  getTransportConfig(): any;
}
