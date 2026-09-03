import type { ImageConfig } from '../../base/image-config.interface';

/**
 * Product structure.
 */
export interface Product {
  /**
   * Product image.
   */
  image: ImageConfig;

  /**
   * Product category or tag.
   */
  category?: string;

  /**
   * Product name.
   */
  name: string;

  /**
   * Product description.
   */
  description: string;

  /**
   * Product price (formatted string, e.g., "$210.00").
   */
  price: string;

  /**
   * Purchase/product page URL.
   */
  url: string;
}
