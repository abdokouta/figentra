/**
 * WebFont interface.
 *
 * This file contains interface definitions for web font configuration
 * used in email templates.
 *
 * @module email-templates/base
 */

/**
 * Font web font configuration.
 */
export interface WebFont {
  /**
   * URL to the font file.
   *
   * @example "https://fonts.googleapis.com/css?family=Roboto"
   */
  url: string;

  /**
   * Font file format.
   *
   * @example "woff2"
   */
  format: 'woff' | 'woff2' | 'truetype' | 'opentype' | 'embedded-opentype' | 'svg';
}
