import React from 'react';

import { cva } from 'class-variance-authority';
import { Container as ReactContainer } from '@react-email/components';
import { cn } from '@resources/utils/cn';
import type { ContainerProps } from '@resources/interfaces/base/container.interface';

/**
 * Container variant styles configuration.
 *
 * This CVA configuration defines the max-width and padding variants
 * available for the Container component. Containers help maintain
 * readable line lengths and consistent spacing in email layouts.
 *
 * Max Width:
 * - sm: 480px - Mobile-friendly narrow container
 * - md: 600px - Standard email width (default)
 * - lg: 680px - Wider container for rich content
 * - full: 100% - Full width, no constraint
 *
 * Padding:
 * - none: No padding
 * - sm: 16px padding
 * - md: 24px padding (default)
 * - lg: 32px padding
 */
export const containerVariants = cva(
  // Base styles - centered with auto margins
  'mx-auto',
  {
    variants: {
      /**
       * Maximum width constraint for the container.
       */
      maxWidth: {
        /**
         * Small container - 480px, ideal for mobile-first designs.
         */
        sm: 'max-w-[480px]',

        /**
         * Medium container - 600px, standard email width.
         */
        md: 'max-w-[600px]',

        /**
         * Large container - 680px, for rich content layouts.
         */
        lg: 'max-w-[680px]',

        /**
         * Full width container - No width constraint.
         */
        full: 'max-w-full',
      },

      /**
       * Internal padding of the container.
       */
      padding: {
        /**
         * No padding - Content touches edges.
         */
        none: 'p-0',

        /**
         * Small padding - 16px all around.
         */
        sm: 'p-[16px]',

        /**
         * Medium padding - 24px all around.
         */
        md: 'p-[24px]',

        /**
         * Large padding - 32px all around.
         */
        lg: 'p-[32px]',
      },
    },

    // Default variants
    defaultVariants: {
      maxWidth: 'md',
      padding: 'md',
    },
  },
);

/**
 * Container component for email templates.
 *
 * A responsive container that constrains content width and provides
 * consistent spacing. Essential for creating well-structured email
 * layouts that work across different screen sizes and email clients.
 *
 * Features:
 * - Four max-width variants (sm, md, lg, full)
 * - Four padding variants (none, sm, md, lg)
 * - Automatic horizontal centering
 * - Email client compatibility
 * - Type-safe variant props
 * - Custom className support
 *
 * @param props - Component properties
 * @returns Rendered container component
 *
 * @example
 * ```tsx
 * // Standard container with default settings
 * <Container>
 *   <Heading>Welcome</ReactHeading>
 *   <Text>Your content here</ReactText>
 * </ReactContainer>
 *
 * // Narrow container with small padding
 * <Container maxWidth="sm" padding="sm">
 *   <Text>Mobile-optimized content</ReactText>
 * </ReactContainer>
 *
 * // Wide container with large padding
 * <Container maxWidth="lg" padding="lg">
 *   <Heading>Rich Content Section</ReactHeading>
 *   <Text>Detailed information...</ReactText>
 * </ReactContainer>
 *
 * // Full width container with custom background
 * <Container maxWidth="full" padding="none" className="bg-gray-50">
 *   <Text>Full-width banner content</ReactText>
 * </ReactContainer>
 * ```
 */
export const Container: React.FC<ContainerProps> = ({ maxWidth, padding, children, className }) => {
  // Combine variant classes with custom className
  const combinedClassName = cn(containerVariants({ maxWidth, padding }), className);

  // Render the Container component with merged classes
  return <ReactContainer className={combinedClassName}>{children}</ReactContainer>;
};
