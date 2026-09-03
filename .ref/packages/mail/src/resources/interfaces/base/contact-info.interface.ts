/**
 * ContactInfo interface.
 *
 * This file contains interface definitions for contact information
 * used in footers and other components.
 *
 * @module email-templates/base
 */

/**
 * Contact information interface.
 *
 * Contains contact details for footers and other components.
 */
export interface ContactInfo {
  /**
   * Physical address.
   *
   * @example "123 Main Street, Anytown, CA 12345"
   */
  address?: string;

  /**
   * Contact email address.
   *
   * @example "contact@example.com"
   */
  email?: string;

  /**
   * Contact phone number.
   *
   * @example "+1 (555) 123-4567"
   */
  phone?: string;

  /**
   * Website URL.
   *
   * @example "https://example.com"
   */
  website?: string;
}
