/**
 * Email address with optional name
 *
 * @interface IAddress
 */
export interface IAddress {
  /**
   * Email address
   */
  address: string;

  /**
   * Display name
   */
  name?: string;
}
