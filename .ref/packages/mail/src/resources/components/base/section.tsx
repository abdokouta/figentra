import React from 'react';

import { cva } from 'class-variance-authority';
import { Section as ReactSection } from '@react-email/components';
import { cn } from '@resources/utils/cn';
import type { SectionProps } from '@resources/interfaces/base/section.interface';

/**
 * Section variant styles configuration.
 *
 * This CVA configuration defines spacing variants for the Section
 * component. Sections help organize content into logical groups with
 * appropriate spacing.
 *
 * Spacing:
 * - none: No spacing
 * - sm: Small spacing (12px)
 * - md: Medium spacing (16px) - default
 * - lg: Large spacing (24px)
 * - xl: Extra large spacing (32px)
 */
export const sectionVariants = cva(
  // Base styles
  '',
  {
    variants: {
      /**
       * Vertical spacing (margin/padding) for the section.
       */
      spacing: {
        /**
         * No spacing - Section touches adjacent elements.
         */
        none: 'my-0',

        /**
         * Small spacing - 12px vertical margins.
         */
        sm: 'my-[12px]',

        /**
         * Medium spacing - 16px vertical margins.
         */
        md: 'my-[16px]',

        /**
         * Large spacing - 24px vertical margins.
         */
        lg: 'my-[24px]',

        /**
         * Extra large spacing - 32px vertical margins.
         */
        xl: 'my-[32px]',
      },
    },

    // Default variant
    defaultVariants: {
      spacing: 'md',
    },
  },
);

/**
 * Section component for email templates.
 *
 * A flexible section wrapper for organizing email content into
 * logical groups. Provides consistent spacing options and serves
 * as a semantic container for related content.
 *
 * Features:
 * - Five spacing variants (none, sm, md, lg, xl)
 * - Semantic HTML structure
 * - Email client compatibility
 * - Type-safe variant props
 * - Custom className support
 *
 * @param props - Component properties
 * @returns Rendered section component
 *
 * @example
 * ```tsx
 * // Standard section with default spacing
 * <Section>
 *   <Heading>Section Title</ReactHeading>
 *   <Text>Section content goes here</ReactText>
 * </ReactSection>
 *
 * // Section with large spacing
 * <Section spacing="lg">
 *   <Heading>Important Section</ReactHeading>
 *   <Text>Content with more breathing room</ReactText>
 * </ReactSection>
 *
 * // Section with no spacing and custom background
 * <Section spacing="none" className="bg-gray-50 p-6">
 *   <Text>Custom styled section</ReactText>
 * </ReactSection>
 * ```
 */
export const Section: React.FC<SectionProps> = ({ spacing, children, className }) => {
  // Combine variant classes with custom className
  const combinedClassName = cn(sectionVariants({ spacing }), className);

  // Render the Section component with merged classes
  return <ReactSection className={combinedClassName}>{children}</ReactSection>;
};
