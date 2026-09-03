/**
 * Row component interface.
 *
 * This file contains interface definitions for the Row component,
 * a row container for column layouts.
 *
 * @module email-templates/base
 */

/**
 * Props for the Row component.
 *
 * Row container for column layouts.
 */
export interface RowProps {
  /**
   * Row content (typically Column components).
   */
  children: React.ReactNode;

  /**
   * Additional CSS classes.
   *
   * @example "mt-4"
   */
  className?: string;
}
