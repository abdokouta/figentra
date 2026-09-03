/**
 * ImageConfig interface.
 *
 * This file contains interface definitions for image configuration
 * used in galleries, articles, and other components.
 *
 * @module email-templates/base
 */

/**
 * Image configuration interface.
 *
 * Defines the structure for images used in galleries,
 * articles, and other components.
 */
export interface ImageConfig {
  /**
   * The URL or path to the image.
   *
   * @example "https://example.com/image.jpg"
   */
  src: string;

  /**
   * Alternative text for the image.
   *
   * @example "Product showcase"
   */
  alt: string;

  /**
   * Optional link URL when the image is clicked.
   *
   * @example "https://example.com/product"
   */
  href?: string;

  /**
   * Width of the image in pixels or percentage.
   *
   * @example 300
   * @example "100%"
   */
  width?: number | string;

  /**
   * Height of the image in pixels.
   *
   * @example 200
   */
  height?: number;

  /**
   * Optional caption text displayed below the image.
   *
   * @example "Our latest product"
   */
  caption?: string;
}
