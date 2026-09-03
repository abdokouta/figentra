import type { Logo } from './logo.interface';

/**
 * Company information interface.
 *
 * Contains basic company details used in footers and headers.
 */
export interface CompanyInfo {
  /**
   * Company name.
   *
   * @example "Acme Corporation"
   */
  name: string;

  /**
   * Company logo.
   */
  logo?: Logo;

  /**
   * Company tagline or slogan.
   *
   * @example "Think Different"
   */
  tagline?: string;

  /**
   * Company description.
   *
   * @example "We make amazing products"
   */
  description?: string;
}
