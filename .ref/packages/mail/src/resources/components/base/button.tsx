import React from 'react';

import { cva } from 'class-variance-authority';

import { cn } from '@resources/utils/cn';
import { Button as ReactButton } from '@react-email/components';
import type { ButtonProps } from '@resources/interfaces/base/button.interface';

/**
 * Button variant styles configuration.
 *
 * This CVA configuration defines the visual variants, sizes, and layout
 * options available for the Button component. Each variant is
 * carefully designed to ensure compatibility across email clients.
 *
 * Variants:
 * - primary: Bold, high-contrast button for main call-to-actions
 * - secondary: Subtle button with border for secondary actions
 * - ghost: Transparent button for tertiary actions
 * - outline: Outlined button without background
 *
 * Sizes:
 * - sm: Small button for compact layouts
 * - md: Medium button for standard use (default)
 * - lg: Large button for prominent call-to-actions
 *
 * Layout:
 * - fullWidth: Makes button span full width of container
 */
export const buttonVariants = cva(
  // Base styles applied to all buttons
  // These ensure consistent baseline appearance across email clients
  'box-border text-center font-semibold [text-decoration:none] inline-block',
  {
    // Variant definitions
    variants: {
      /**
       * Visual style variant of the button.
       */
      variant: {
        /**
         * Primary variant - Bold indigo background with white text.
         * Use for main call-to-actions like "Sign Up", "Buy Now", "Get Started".
         */
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700',

        /**
         * Secondary variant - White background with border.
         * Use for secondary actions like "Learn More", "Cancel", "Go Back".
         */
        secondary: 'border border-gray-200 border-solid bg-white text-gray-900 hover:bg-gray-50',

        /**
         * Ghost variant - Transparent background with colored text.
         * Use for tertiary actions or inline buttons.
         */
        ghost: 'bg-transparent text-indigo-600 border-none hover:bg-indigo-50',

        /**
         * Outline variant - Transparent with colored border.
         * Use for emphasis without strong visual weight.
         */
        outline:
          'border border-indigo-600 border-solid bg-transparent text-indigo-600 hover:bg-indigo-50',
      },

      /**
       * Size variant of the button.
       */
      size: {
        /**
         * Small button - Compact padding for tight layouts.
         */
        sm: 'px-[8px] py-[6px] text-[14px] rounded-[6px]',

        /**
         * Medium button - Standard size for most use cases.
         */
        md: 'px-[12px] py-[12px] text-[16px] rounded-[8px]',

        /**
         * Large button - Prominent size for main call-to-actions.
         */
        lg: 'px-[20px] py-[16px] text-[18px] rounded-[10px]',
      },

      /**
       * Whether the button should span full width of its container.
       */
      fullWidth: {
        /**
         * Full width button - Spans entire container width.
         */
        true: 'w-full block',

        /**
         * Auto width button - Width determined by content.
         */
        false: 'w-auto',
      },
    },

    // Default variants applied when no variant is specified
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  },
);

/**
 * Button component for email templates.
 *
 * A versatile button component that provides consistent styling and behavior
 * across different email clients. Supports multiple visual variants, sizes,
 * and layout options through a type-safe API.
 *
 * Features:
 * - Multiple visual variants (primary, secondary, ghost, outline)
 * - Three size options (sm, md, lg)
 * - Optional full-width layout
 * - Email client compatibility
 * - Type-safe variant props
 * - Custom className support
 *
 * @param props - Component properties
 * @returns Rendered button component
 *
 * @example
 * ```tsx
 * // Primary button (default)
 * <Button href="https://example.com">
 *   Get Started
 * </ReactButton>
 *
 * // Secondary button with large size
 * <Button variant="secondary" size="lg" href="/learn-more">
 *   Learn More
 * </ReactButton>
 *
 * // Full-width ghost button
 * <Button variant="ghost" fullWidth href="#section">
 *   View Details
 * </ReactButton>
 *
 * // With custom classes and target
 * <Button
 *   variant="outline"
 *   href="https://external.com"
 *   target="_blank"
 *   rel="noopener noreferrer"
 *   className="mt-4"
 * >
 *   External Link
 * </ReactButton>
 * ```
 */
export const Button: React.FC<ButtonProps> = ({
  variant,
  size,
  fullWidth,
  href,
  children,
  className,
  target,
  rel,
}) => {
  // Combine variant classes with custom className
  const combinedClassName = cn(buttonVariants({ variant, size, fullWidth }), className);

  return (
    <ReactButton href={href} className={combinedClassName} target={target} rel={rel}>
      {children}
    </ReactButton>
  );
};
