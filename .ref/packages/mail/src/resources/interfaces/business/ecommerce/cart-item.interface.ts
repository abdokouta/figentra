import type { ImageConfig } from '../../base/image-config.interface';

/**
 * Cart item structure.
 */
export interface CartItem {
  /**
   * Product image.
   */
  image: ImageConfig;

  /**
   * Product name.
   */
  name: string;

  /**
   * Quantity.
   */
  quantity: number;

  /**
   * Item price (formatted string).
   */
  price: string;
}
