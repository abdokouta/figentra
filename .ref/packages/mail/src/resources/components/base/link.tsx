import React from 'react';

import { cva } from 'class-variance-authority';
import { Link as ReactLink } from '@react-email/components';
import { cn } from '@resources/utils/cn';
import type { LinkProps } from '@resources/interfaces/base/link.interface';

/**
 * Link variant styles configuration.
 *
 * This CVA configuration defines the style variants available for
 * the Link component. Each variant provides appropriate
 * styling for different link contexts.
 *
 * Variants:
 * - default: Standard blue link with underline
 * - primary: Brand-colored link
 * - secondary: Subtle gray link
 * - unstyled: No default styling
 */
export const linkVariants = cva(
  // Base styles - consistent cursor and transition
  'cursor-pointer',
  {
    variants: {
      /**
       * Visual style variant of the link.
       */
      variant: {
        /**
         * Default link - Blue with underline.
         */
        default: 'text-blue-600 underline hover:text-blue-800',

        /**
         * Primary link - Brand color without underline.
         */
        primary: 'text-indigo-600 [text-decoration:none] hover:text-indigo-800',

        /**
         * Secondary link - Subtle gray without underline.
         */
        secondary: 'text-gray-600 [text-decoration:none] hover:text-gray-800',

        /**
         * Unstyled link - No default colors or underline.
         */
        unstyled: '[text-decoration:none]',
      },
    },

    // Default variant
    defaultVariants: {
      variant: 'default',
    },
  },
);

/**
 * Link component for email templates.
 *
 * A versatile link component for creating hyperlinks in email templates.
 * Supports multiple style variants for different contexts and ensures
 * email client compatibility.
 *
 * Features:
 * - Four style variants (default, primary, secondary, unstyled)
 * - Email client compatibility
 * - Target and rel attribute support
 * - Type-safe variant props
 * - Custom className support
 *
 * @param props - Component properties
 * @returns Rendered link component
 *
 * @example
 * ```tsx
 * // Default blue link
 * <ReactLink href="https://example.com">
 *   Visit our website
 * </ReactLink>
 *
 * // Primary brand-colored link
 * <Link variant="primary" href="/about">
 *   Learn More
 * </ReactLink>
 *
 * // Secondary subtle link
 * <Link variant="secondary" href="/contact">
 *   Contact Us
 * </ReactLink>
 *
 * // External link with security attributes
 * <Link
 *   variant="primary"
 *   href="https://external.com"
 *   target="_blank"
 *   rel="noopener noreferrer"
 * >
 *   External Link
 * </ReactLink>
 * ```
 */
export const Link: React.FC<LinkProps> = ({ variant, href, children, className, target, rel }) => {
  // Combine variant classes with custom className
  const combinedClassName = cn(linkVariants({ variant }), className);

  // Render the Link component with merged classes
  return (
    <ReactLink href={href} className={combinedClassName} target={target} rel={rel}>
      {children}
    </ReactLink>
  );
};
