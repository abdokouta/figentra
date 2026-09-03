import type { Logo, SocialLink } from '../../../base';

/**
 * Props for the HeaderSocialIcons component.
 *
 * A header with logo on the left and social icons on the right.
 */
export interface HeaderSocialIconsProps {
  /**
   * Logo configuration.
   */
  logo: Logo;

  /**
   * Social media links with icons.
   */
  socialLinks: SocialLink[];

  /**
   * Size of social media icons in pixels.
   * @default 24
   */
  iconSize?: number;

  /**
   * Additional CSS classes for the section.
   */
  className?: string;
}
