import type { VariantProps } from 'class-variance-authority';
import type { imageVariants } from '@resources/components/base/image';

/**
 * Props for the Image component.
 *
 * Extends the variant props from CVA to provide type-safe
 * display and fit options along with standard image properties.
 */
export interface ImageProps extends VariantProps<typeof imageVariants> {
  /**
   * The URL or path to the image.
   *
   * @example "https://example.com/image.jpg"
   * @example "/static/banner.png"
   */
  src: string;

  /**
   * Alternative text for the image.
   *
   * @example "Product showcase"
   * @example "Company banner"
   */
  alt: string;

  /**
   * Image width in pixels or percentage.
   *
   * @example 600
   * @example "100%"
   */
  width?: number | string;

  /**
   * Image height in pixels.
   *
   * @example 400
   */
  height?: number;

  /**
   * Additional CSS classes to apply to the image.
   *
   * @example "rounded-lg"
   * @example "border border-gray-200"
   */
  className?: string;
}
