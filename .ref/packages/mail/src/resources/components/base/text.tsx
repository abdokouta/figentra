import React from 'react';

import { cva } from 'class-variance-authority';

import { cn } from '@resources/utils/cn';
import { Text as ReactText } from '@react-email/components';
import type { TextProps } from '@resources/interfaces/base/text.interface';

/**
 * Text variant styles configuration.
 *
 * This CVA configuration defines the size, color, alignment, and weight
 * options available for the Text component. Each variant is optimized
 * for readability across email clients.
 *
 * Sizes:
 * - xs: Extra small text (12px)
 * - sm: Small text (14px)
 * - md: Medium text (16px) - default
 * - lg: Large text (18px)
 * - xl: Extra large text (24px)
 *
 * Colors:
 * - default: Standard gray-900 for body text
 * - secondary: Gray-500 for supporting text
 * - primary: Indigo-600 for emphasized text
 * - muted: Gray-400 for subtle text
 *
 * Alignment:
 * - left: Left-aligned text (default)
 * - center: Center-aligned text
 * - right: Right-aligned text
 *
 * Weight:
 * - normal: Regular font weight (default)
 * - medium: Medium font weight
 * - semibold: Semi-bold font weight
 * - bold: Bold font weight
 */
export const textVariants = cva(
  // Base styles - consistent margins and line-height
  'm-0',
  {
    variants: {
      /**
       * Size variant of the text.
       */
      size: {
        /**
         * Extra small text - 12px, ideal for captions and footnotes.
         */
        xs: 'text-[12px] leading-[18px]',

        /**
         * Small text - 14px, good for supporting content.
         */
        sm: 'text-[14px] leading-[20px]',

        /**
         * Medium text - 16px, standard for body text.
         */
        md: 'text-[16px] leading-[24px]',

        /**
         * Large text - 18px, suitable for emphasized paragraphs.
         */
        lg: 'text-[18px] leading-[28px]',

        /**
         * Extra large text - 24px, for standout content.
         */
        xl: 'text-[24px] leading-[32px]',
      },

      /**
       * Color variant of the text.
       */
      color: {
        /**
         * Default color - Gray-900, standard for body text.
         */
        default: 'text-gray-900',

        /**
         * Secondary color - Gray-500, for supporting text.
         */
        secondary: 'text-gray-500',

        /**
         * Primary color - Indigo-600, for brand-emphasized text.
         */
        primary: 'text-indigo-600',

        /**
         * Muted color - Gray-400, for subtle, low-emphasis text.
         */
        muted: 'text-gray-400',
      },

      /**
       * Text alignment.
       */
      align: {
        /**
         * Left-aligned text.
         */
        left: 'text-left',

        /**
         * Center-aligned text.
         */
        center: 'text-center',

        /**
         * Right-aligned text.
         */
        right: 'text-right',
      },

      /**
       * Font weight of the text.
       */
      weight: {
        /**
         * Normal font weight - 400.
         */
        normal: 'font-normal',

        /**
         * Medium font weight - 500.
         */
        medium: 'font-medium',

        /**
         * Semi-bold font weight - 600.
         */
        semibold: 'font-semibold',

        /**
         * Bold font weight - 700.
         */
        bold: 'font-bold',
      },
    },

    // Default variants
    defaultVariants: {
      size: 'md',
      color: 'default',
      align: 'left',
      weight: 'normal',
    },
  },
);

/**
 * Text component for email templates.
 *
 * A versatile text component that provides consistent typography and styling
 * across different email clients. Supports multiple sizes, colors, alignments,
 * and font weights through a type-safe API.
 *
 * Features:
 * - Five size variants (xs, sm, md, lg, xl)
 * - Four color options (default, secondary, primary, muted)
 * - Three alignment options (left, center, right)
 * - Four font weight options (normal, medium, semibold, bold)
 * - Email client compatibility
 * - Type-safe variant props
 * - Custom className support
 * - Customizable HTML element
 *
 * @param props - Component properties
 * @returns Rendered text component
 *
 * @example
 * ```tsx
 * // Default text
 * <Text>This is body text</ReactText>
 *
 * // Large, centered, bold text
 * <Text size="lg" align="center" weight="bold">
 *   Important Message
 * </ReactText>
 *
 * // Secondary colored, small text
 * <Text size="sm" color="secondary">
 *   Supporting information
 * </ReactText>
 *
 * // Primary colored, semibold text with custom class
 * <Text color="primary" weight="semibold" className="mt-4">
 *   Call to action text
 * </ReactText>
 * ```
 */
export const Text: React.FC<TextProps> = ({ size, color, align, weight, children, className }) => {
  // Combine variant classes with custom className
  const combinedClassName = cn(textVariants({ size, color, align, weight }), className);

  // Render the Text component with the combined class name
  return <ReactText className={combinedClassName}>{children}</ReactText>;
};
