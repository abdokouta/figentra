/**
 * Logo interface.
 *
 * This file contains interface definitions for logo images used
 * in headers, footers, and other components throughout email templates.
 *
 * @module email-templates/base
 */

/**
 * Logo configuration interface.
 *
 * Defines the structure for logo images used in headers, footers,
 * and other components throughout email templates.
 */
export interface Logo {
  /**
   * The URL or path to the logo image.
   *
   * @example "https://example.com/logo.png"
   * @example "/static/logo.png"
   */
  src: string;

  /**
   * Alternative text for the logo image.
   *
   * This text is displayed when the image cannot be loaded
   * and is used by screen readers for accessibility.
   *
   * @example "Company Logo"
   * @example "Acme Corporation"
   */
  alt: string;

  /**
   * Height of the logo in pixels.
   *
   * @default 42
   * @example 50
   */
  height?: number;

  /**
   * Width of the logo in pixels.
   *
   * If not specified, the width will be automatically
   * calculated based on the image's aspect ratio.
   *
   * @example 120
   */
  width?: number;
}
