/**
 * Html component interface.
 *
 * This file contains interface definitions for the EmailHtml component,
 * the root HTML wrapper for email templates.
 *
 * @module email-templates/base
 */

/**
 * Props for the EmailHtml component.
 *
 * Root HTML wrapper for email templates.
 */
export interface HtmlProps {
  /**
   * The email content.
   */
  children: React.ReactNode;

  /**
   * Language code for the HTML document.
   *
   * @default "en"
   * @example "es"
   * @example "fr"
   */
  lang?: string;

  /**
   * Text direction.
   *
   * @default "ltr"
   * @example "rtl"
   */
  dir?: 'ltr' | 'rtl';

  /**
   * Additional CSS classes.
   */
  className?: string;
}
