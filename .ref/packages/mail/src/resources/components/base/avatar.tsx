import React from 'react';

import { cva } from 'class-variance-authority';

import { cn } from '@resources/utils/cn';
import { Img, Link as ReactLink } from '@react-email/components';
import type { AvatarProps } from '@resources/interfaces/base/avatar.interface';

/**
 * Avatar variant styles configuration.
 *
 * This CVA configuration defines the size and shape options available
 * for the Avatar component. Each variant is designed to work
 * seamlessly across different email clients.
 *
 * Sizes:
 * - xs: 30px - Small avatars for compact layouts
 * - sm: 42px - Standard small avatars
 * - md: 54px - Medium avatars (default)
 * - lg: 66px - Large prominent avatars
 * - xl: 96px - Extra large showcase avatars
 *
 * Shapes:
 * - circle: Fully rounded (100%) for profile pictures
 * - rounded: Moderately rounded corners for a softer look
 * - square: Sharp corners for formal contexts
 */
export const avatarVariants = cva(
  // Base styles - ensures proper display and object fitting
  'inline-block object-cover object-center',
  {
    variants: {
      /**
       * Size variant of the avatar.
       */
      size: {
        /**
         * Extra small avatar - 30px, for compact layouts.
         */
        xs: 'w-[30px] h-[30px]',

        /**
         * Small avatar - 42px, for list items and tight spaces.
         */
        sm: 'w-[42px] h-[42px]',

        /**
         * Medium avatar - 54px, standard size for most contexts.
         */
        md: 'w-[54px] h-[54px]',

        /**
         * Large avatar - 66px, for emphasized user profiles.
         */
        lg: 'w-[66px] h-[66px]',

        /**
         * Extra large avatar - 96px, for hero sections and showcases.
         */
        xl: 'w-[96px] h-[96px]',
      },

      /**
       * Shape variant of the avatar.
       */
      shape: {
        /**
         * Circular avatar - Fully rounded, ideal for profile pictures.
         */
        circle: 'rounded-full',

        /**
         * Rounded avatar - Moderately rounded corners.
         */
        rounded: 'rounded-md',

        /**
         * Square avatar - Sharp corners, for formal contexts.
         */
        square: 'rounded-none',
      },
    },

    // Default variants
    defaultVariants: {
      size: 'md',
      shape: 'circle',
    },
  },
);

/**
 * Avatar component for email templates.
 *
 * A versatile avatar component for displaying user profile pictures
 * and other circular/rounded images. Supports multiple sizes and shapes
 * with optional link wrapping for interactive avatars.
 *
 * Features:
 * - Five size variants (xs, sm, md, lg, xl)
 * - Three shape variants (circle, rounded, square)
 * - Optional link wrapping
 * - Email client compatibility
 * - Proper object-fit and centering
 * - Type-safe variant props
 * - Custom className support
 *
 * @param props - Component properties
 * @returns Rendered avatar component
 *
 * @example
 * ```tsx
 * // Default circular avatar
 * <Avatar
 *   src="https://example.com/avatar.jpg"
 *   alt="John Doe"
 * />
 *
 * // Large circular avatar with link
 * <Avatar
 *   src="https://example.com/avatar.jpg"
 *   alt="John Doe"
 *   size="lg"
 *   href="https://example.com/profile"
 * />
 *
 * // Small rounded avatar
 * <Avatar
 *   src="https://example.com/avatar.jpg"
 *   alt="Jane Smith"
 *   size="sm"
 *   shape="rounded"
 * />
 *
 * // Extra large avatar with custom border
 * <Avatar
 *   src="https://example.com/avatar.jpg"
 *   alt="Team Lead"
 *   size="xl"
 *   className="border-4 border-white shadow-lg"
 * />
 * ```
 */
export const Avatar: React.FC<AvatarProps> = ({ size, shape, src, alt, href, className }) => {
  // Combine variant classes with custom className
  const combinedClassName = cn(avatarVariants({ size, shape }), className);

  // Get dimensions based on size for the Img component
  const dimensions = {
    xs: 30,
    sm: 42,
    md: 54,
    lg: 66,
    xl: 96,
  };

  const dimension = dimensions[size || ('md' as keyof typeof dimensions)];

  // Render the avatar image
  const avatarImage = (
    <Img src={src} alt={alt} width={dimension} height={dimension} className={combinedClassName} />
  );

  // Wrap in a link if href is provided
  if (href) {
    return <ReactLink href={href}>{avatarImage}</ReactLink>;
  }

  // Return unwrapped avatar if no href
  return avatarImage;
};
