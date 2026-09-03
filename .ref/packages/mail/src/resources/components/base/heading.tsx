import React from 'react';

import { cva } from 'class-variance-authority';

import { cn } from '@resources/utils/cn';
import { Heading as ReactHeading } from '@react-email/components';
import type { HeadingProps } from '@resources/interfaces/base/heading.interface';

/**
 * Heading variant styles configuration.
 *
 * This CVA configuration defines the level, color, alignment, and weight
 * options available for the Heading component. Each variant provides
 * appropriate sizing and styling for different heading contexts.
 *
 * Levels:
 * - h1: Largest heading (36px) - Page titles
 * - h2: Section heading (30px) - Major sections
 * - h3: Subsection heading (24px) - Subsections
 * - h4: Minor heading (20px) - Card titles
 * - h5: Small heading (18px) - List items
 * - h6: Smallest heading (16px) - Inline titles
 *
 * Colors:
 * - default: Gray-900 for standard headings
 * - primary: Indigo-600 for branded headings
 * - secondary: Gray-500 for de-emphasized headings
 *
 * Alignment:
 * - left: Left-aligned (default)
 * - center: Center-aligned
 * - right: Right-aligned
 *
 * Weight:
 * - normal: Regular weight (400)
 * - medium: Medium weight (500)
 * - semibold: Semi-bold weight (600)
 * - bold: Bold weight (700)
 */
export const headingVariants = cva(
  // Base styles - consistent margins
  'm-0',
  {
    variants: {
      /**
       * Semantic level of the heading.
       * Determines the font size and line height.
       */
      level: {
        /**
         * H1 heading - 36px, for main page titles.
         */
        h1: 'text-[36px] leading-[44px]',

        /**
         * H2 heading - 30px, for major section headings.
         */
        h2: 'text-[30px] leading-[36px]',

        /**
         * H3 heading - 24px, for subsection headings.
         */
        h3: 'text-[24px] leading-[32px]',

        /**
         * H4 heading - 20px, for minor headings and card titles.
         */
        h4: 'text-[20px] leading-[28px]',

        /**
         * H5 heading - 18px, for small headings.
         */
        h5: 'text-[18px] leading-[24px]',

        /**
         * H6 heading - 16px, for inline titles.
         */
        h6: 'text-[16px] leading-[20px]',
      },

      /**
       * Color variant of the heading.
       */
      color: {
        /**
         * Default color - Gray-900, standard for headings.
         */
        default: 'text-gray-900',

        /**
         * Primary color - Indigo-600, for brand-emphasized headings.
         */
        primary: 'text-indigo-600',

        /**
         * Secondary color - Gray-500, for de-emphasized headings.
         */
        secondary: 'text-gray-500',
      },

      /**
       * Text alignment.
       */
      align: {
        /**
         * Left-aligned heading.
         */
        left: 'text-left',

        /**
         * Center-aligned heading.
         */
        center: 'text-center',

        /**
         * Right-aligned heading.
         */
        right: 'text-right',
      },

      /**
       * Font weight of the heading.
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
      level: 'h2',
      color: 'default',
      align: 'left',
      weight: 'semibold',
    },
  },
);

/**
 * Heading component for email templates.
 *
 * A semantic heading component that provides consistent typography across
 * different email clients. Automatically adjusts size based on heading level
 * while supporting color, alignment, and weight customization.
 *
 * Features:
 * - Six semantic levels (h1-h6)
 * - Three color options (default, primary, secondary)
 * - Three alignment options (left, center, right)
 * - Four font weight options (normal, medium, semibold, bold)
 * - Email client compatibility
 * - Proper semantic HTML structure
 * - Type-safe variant props
 * - Custom className support
 *
 * @param props - Component properties
 * @returns Rendered heading component
 *
 * @example
 * ```tsx
 * // H1 heading with default styling
 * <Heading as="h1" level="h1">
 *   Main Page Title
 * </ReactHeading>
 *
 * // Centered H2 heading with primary color
 * <Heading as="h2" level="h2" color="primary" align="center">
 *   Section Title
 * </ReactHeading>
 *
 * // H3 heading with custom weight
 * <Heading as="h3" level="h3" weight="bold">
 *   Subsection Title
 * </ReactHeading>
 *
 * // H4 heading with custom classes
 * <Heading as="h4" level="h4" className="mt-8 mb-4">
 *   Card Title
 * </ReactHeading>
 * ```
 */
export const Heading: React.FC<HeadingProps> = ({
  level,
  color,
  align,
  weight,
  children,
  className,
}) => {
  // Combine variant classes with custom className
  const combinedClassName = cn(headingVariants({ level, color, align, weight }), className);

  // Render the Heading component with the combined class name
  return <ReactHeading className={combinedClassName}>{children}</ReactHeading>;
};
