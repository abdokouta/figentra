/**
 * Column component interface.
 *
 * This file contains interface definitions for the Column component,
 * used for grid layouts within rows.
 *
 * @module email-templates/base
 */

/**
 * Props for the Column component.
 *
 * Column for grid layouts within rows.
 */
export interface ColumnProps {
  /**
   * Column content.
   */
  children: React.ReactNode;

  /**
   * Additional CSS classes.
   *
   * @example "w-1/2"
   */
  className?: string;

  /**
   * Text alignment within column.
   *
   * @example "center"
   */
  align?: 'left' | 'center' | 'right';
}
