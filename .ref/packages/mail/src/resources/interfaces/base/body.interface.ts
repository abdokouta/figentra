/**
 * Body component interface.
 *
 * This file contains interface definitions for the EmailBody component,
 * the main email body wrapper.
 *
 * @module email-templates/base
 */

/**
 * Props for the EmailBody component.
 *
 * Main email body wrapper.
 */
export interface BodyProps {
  /**
   * Body content.
   */
  children: React.ReactNode;

  /**
   * Additional CSS classes.
   *
   * @example "bg-gray-50"
   */
  className?: string;
}
