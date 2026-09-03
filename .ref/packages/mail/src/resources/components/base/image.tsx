import React from 'react';

import { cva } from 'class-variance-authority';
import { Img as ReactImg } from '@react-email/components';
import { cn } from '@resources/utils/cn';
import type { ImageProps } from '@resources/interfaces/base/image.interface';

/**
 * Image variant styles configuration.
 *
 * This CVA configuration defines display and object-fit variants
 * for the Image component.
 *
 * Display:
 * - block: Block-level image (default)
 * - inline: Inline image
 *
 * Fit:
 * - cover: Image covers entire area
 * - contain: Image contained within area
 * - none: No object-fit styling
 */
export const imageVariants = cva(
  // Base styles
  '',
  {
    variants: {
      /**
       * Display type of the image.
       */
      display: {
        /**
         * Block display - Image takes full width available.
         */
        block: 'block w-full',

        /**
         * Inline display - Image flows with text.
         */
        inline: 'inline-block',
      },

      /**
       * How the image fits its container.
       */
      fit: {
        /**
         * Cover fit - Image covers entire container.
         */
        cover: 'object-cover',

        /**
         * Contain fit - Image contained within container.
         */
        contain: 'object-contain',

        /**
         * No fit styling - Use natural image dimensions.
         */
        none: '',
      },
    },

    // Default variants
    defaultVariants: {
      display: 'block',
      fit: 'cover',
    },
  },
);

/**
 * Image component for email templates.
 *
 * A versatile image component for displaying photos, illustrations,
 * logos, and other visual content. Supports different display and
 * fit options for various image contexts.
 *
 * Features:
 * - Two display variants (block, inline)
 * - Three fit variants (cover, contain, none)
 * - Responsive sizing support
 * - Email client compatibility
 * - Type-safe variant props
 * - Custom className support
 *
 * @param props - Component properties
 * @returns Rendered image component
 *
 * @example
 * ```tsx
 * // Standard block image
 * <Image
 *   src="https://example.com/banner.jpg"
 *   alt="Banner image"
 *   width={600}
 *   height={400}
 * />
 *
 * // Inline image within text
 * <Text>
 *   Check out our logo:
 *   <Image
 *     src="https://example.com/logo.png"
 *     alt="Logo"
 *     display="inline"
 *     width={24}
 *     height={24}
 *   />
 * </ReactText>
 *
 * // Image with contain fit and custom classes
 * <Image
 *   src="https://example.com/product.jpg"
 *   alt="Product"
 *   fit="contain"
 *   width={300}
 *   height={300}
 *   className="rounded-lg border border-gray-200"
 * />
 * ```
 */
export const Image: React.FC<ImageProps> = ({
  display,
  fit,
  src,
  alt,
  width,
  height,
  className,
}) => {
  // Combine variant classes with custom className
  const combinedClassName = cn(imageVariants({ display, fit }), className);

  // Render the Img component with merged classes
  return (
    <ReactImg src={src} alt={alt} width={width} height={height} className={combinedClassName} />
  );
};
