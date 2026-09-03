import type { CompanyInfo, ContactInfo, MenuItem, SocialLink } from '../../../base';

/**
 * Props for FooterOneColumn component.
 *
 * Single column footer layout with centered content.
 * Typically includes company info, social links, and optional menu items.
 */
export interface FooterOneColumnProps {
  /**
   * Company information to display (name, logo, tagline).
   */
  company: CompanyInfo;

  /**
   * Optional menu items to display.
   */
  menuItems?: MenuItem[];

  /**
   * Optional social media links.
   */
  socialLinks?: SocialLink[];

  /**
   * Optional contact information.
   */
  contact?: ContactInfo;

  /**
   * Copyright text (e.g., "© 2024 Company Name. All rights reserved.").
   */
  copyright?: string;

  /**
   * Optional additional CSS classes.
   */
  className?: string;
}
