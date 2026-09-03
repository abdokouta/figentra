import type { CompanyInfo, ContactInfo, MenuItem, SocialLink } from '../../../base';

/**
 * Props for FooterTwoColumns component.
 *
 * Two-column footer layout with content divided into left and right sections.
 * Ideal for footers with more content that needs organized layout.
 */
export interface FooterTwoColumnsProps {
  /**
   * Company information to display in left column.
   */
  company: CompanyInfo;

  /**
   * Optional menu items to display in right column.
   */
  menuItems?: MenuItem[];

  /**
   * Optional social media links (displayed in left or right column).
   */
  socialLinks?: SocialLink[];

  /**
   * Optional contact information to display in left column.
   */
  contact?: ContactInfo;

  /**
   * Copyright text (displayed at bottom, full width).
   */
  copyright?: string;

  /**
   * Size of social media icons (default: 24).
   */
  iconSize?: number;

  /**
   * Optional additional CSS classes.
   */
  className?: string;
}
