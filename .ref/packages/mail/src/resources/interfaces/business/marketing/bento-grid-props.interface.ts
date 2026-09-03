import type { ImageConfig } from '../../base/image-config.interface';
import type { BentoGridProduct } from './bento-grid-product.interface';

/**
 * Props for BentoGrid component.
 */
export interface BentoGridProps {
  /**
   * Hero section configuration.
   */
  hero: {
    /**
     * Hero title.
     */
    title: string;

    /**
     * Hero description.
     */
    description: string;

    /**
     * Link text.
     */
    linkText: string;

    /**
     * Link URL.
     */
    linkUrl: string;

    /**
     * Hero image.
     */
    image: ImageConfig;

    /**
     * Optional background color.
     */
    backgroundColor?: string;
  };

  /**
   * Array of product items.
   */
  products: BentoGridProduct[];

  /**
   * Optional additional CSS classes.
   */
  className?: string;
}
