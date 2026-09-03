import React from 'react';

import { cva } from 'class-variance-authority';
import { Hr as ReactHr } from '@react-email/components';

import { cn } from '@resources/utils/cn';
import type { DividerProps } from '@resources/interfaces/base/divider.interface';

/**
 * Divider variant styles configuration.
 *
 * This CVA configuration defines the spacing and style options available
 * for the Divider component. Each variant provides appropriate
 * visual separation for different contexts.
 *
 * Spacing:
 * - sm: Small spacing (12px vertical margins)
 * - md: Medium spacing (16px vertical margins) - default
 * - lg: Large spacing (24px vertical margins)
 * - xl: Extra large spacing (32px vertical margins)
 *
 * Style:
 * - solid: Solid line (default)
 * - light: Light gray color for subtle separation
 * - heavy: Thicker line for strong separation
 */
export const dividerVariants = cva(
  // Base styles - consistent border styling
  'border-gray-300 border-t-2',
  {
    variants: {
      /**
       * Vertical spacing around the divider.
       */
      spacing: {
        /**
         * Small spacing - 12px top and bottom margins.
         */
        sm: 'my-[12px]',

        /**
         * Medium spacing - 16px top and bottom margins.
         */
        md: 'my-[16px]',

        /**
         * Large spacing - 24px top and bottom margins.
         */
        lg: 'my-[24px]',

        /**
         * Extra large spacing - 32px top and bottom margins.
         */
        xl: 'my-[32px]',
      },

      /**
       * Visual style of the divider.
       */
      style: {
        /**
         * Solid line - Standard border.
         */
        solid: 'border-gray-300',

        /**
         * Light line - Subtle, lighter gray.
         */
        light: 'border-gray-200',

        /**
         * Heavy line - Thicker, more prominent.
         */
        heavy: 'border-gray-400 border-t-[3px]',
      },
    },

    // Default variants
    defaultVariants: {
      spacing: 'md',
      style: 'solid',
    },
  },
);

/**
 * Divider component for email templates.
 *
 * A horizontal rule component for creating visual separation between
 * content sections. Supports multiple spacing and style options for
 * different contexts and design needs.
 *
 * Features:
 * - Four spacing variants (sm, md, lg, xl)
 * - Three style variants (solid, light, heavy)
 * - Email client compatibility
 * - Consistent border styling
 * - Type-safe variant props
 * - Custom className support
 *
 * @param props - Component properties
 * @returns Rendered divider component
 *
 * @example
 * ```tsx
 * // Default divider
 * <Divider />
 *
 * // Large spacing divider
 * <Divider spacing="lg" />
 *
 * // Light style divider with small spacing
 * <Divider spacing="sm" style="light" />
 *
 * // Heavy divider with extra large spacing
 * <Divider spacing="xl" style="heavy" />
 *
 * // Custom styled divider
 * <Divider
 *   spacing="lg"
 *   style="solid"
 *   className="border-indigo-300"
 * />
 * ```
 */
export const Divider: React.FC<DividerProps> = ({ spacing, style, className }) => {
  // Combine variant classes with custom className
  const combinedClassName = cn(dividerVariants({ spacing, style }), className);

  // Render the Hr component with merged classes
  return <ReactHr className={combinedClassName} />;
};
