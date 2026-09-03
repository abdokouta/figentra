/**
 * Preview component interface.
 *
 * This file contains interface definitions for the EmailPreview component,
 * which displays preview text in email client inbox.
 *
 * @module email-templates/base
 */

/**
 * Props for the EmailPreview component.
 *
 * Preview text shown in email client inbox.
 */
export interface PreviewProps {
  /**
   * Preview text content.
   *
   * @example "Welcome to our newsletter"
   */
  children: string;
}
