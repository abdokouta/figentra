import type { Logo, MenuItem } from '../../../base';

/**
 * Props for the HeaderCenteredMenu component.
 *
 * A header with centered logo and horizontal menu navigation.
 */
export interface HeaderCenteredMenuProps {
  /**
   * Logo configuration.
   */
  logo: Logo;

  /**
   * Menu items to display horizontally.
   */
  menuItems: MenuItem[];

  /**
   * Additional CSS classes for the section.
   */
  className?: string;
}
