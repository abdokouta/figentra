/**
 * MenuItem interface.
 *
 * This file contains interface definitions for menu items used
 * in navigation components throughout email templates.
 *
 * @module email-templates/base
 */

/**
 * Menu item configuration interface.
 *
 * Represents a single navigation item in headers, footers,
 * or other menu components.
 */
export interface MenuItem {
  /**
   * Display label for the menu item.
   *
   * @example "About Us"
   * @example "Contact"
   */
  label: string;

  /**
   * URL the menu item should link to.
   *
   * Can be a full URL, relative path, or anchor link.
   *
   * @example "https://example.com/about"
   * @example "/contact"
   * @example "#section"
   */
  href: string;

  /**
   * Optional icon URL to display alongside the label.
   *
   * @example "https://example.com/icon.png"
   */
  icon?: string;
}
