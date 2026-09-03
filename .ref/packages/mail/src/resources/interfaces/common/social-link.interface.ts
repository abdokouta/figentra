/**
 * SocialLink interface.
 *
 * This file contains interface definitions for social media links
 * used in email templates.
 *
 * @module email-templates/base
 */

/**
 * Social media link configuration interface.
 *
 * Defines a social media platform link with its associated icon.
 */
export interface SocialLink {
  /**
   * Name of the social media platform.
   *
   * @example "Facebook"
   * @example "Twitter"
   * @example "LinkedIn"
   */
  platform: string;

  /**
   * URL to the social media profile or page.
   *
   * @example "https://facebook.com/company"
   * @example "https://twitter.com/company"
   */
  href: string;

  /**
   * URL to the social media icon image.
   *
   * @example "https://example.com/facebook-icon.png"
   */
  icon: string;

  /**
   * Alternative text for the icon image.
   *
   * @default Platform name
   * @example "Facebook"
   */
  alt?: string;
}
