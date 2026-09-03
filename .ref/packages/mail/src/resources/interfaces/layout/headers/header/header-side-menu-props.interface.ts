import type { Logo, MenuItem } from '../../../base';

/**
 * Props for the HeaderSideMenu component.
 *
 * A header with logo on the left and menu on the right.
 */
export interface HeaderSideMenuProps {
  /**
   * Logo configuration.
   */
  logo: Logo;

  /**
   * Menu items to display on the right side.
   */
  menuItems: MenuItem[];

  /**
   * Additional CSS classes for the section.
   */
  className?: string;
}
