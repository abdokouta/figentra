import type { SocialLink } from './social-link.interface';

/**
 * Author information interface.
 *
 * Represents author details for articles and blog posts.
 */
export interface Author {
  /**
   * Author's full name.
   *
   * @example "John Doe"
   */
  name: string;

  /**
   * Author's title or role.
   *
   * @example "Senior Writer"
   * @example "CEO & Founder"
   */
  title?: string;

  /**
   * URL to the author's avatar image.
   *
   * @example "https://example.com/avatar.jpg"
   */
  avatar?: string;

  /**
   * Author's social media links.
   */
  socialLinks?: SocialLink[];
}
