/**
 * Head component interface.
 *
 * This file contains interface definitions for the EmailHead component,
 * which contains metadata, styles, and other head elements.
 *
 * @module email-templates/base
 */

/**
 * Props for the EmailHead component.
 *
 * Contains metadata, styles, and other head elements.
 */
export interface HeadProps {
  /**
   * Head content (meta tags, styles, etc.).
   */
  children?: React.ReactNode;
}
