import type { Product } from './product.interface';

/**
 * Props for ProductSingle component (centered, full-width).
 */
export interface ProductSingleProps {
  /**
   * Product details.
   */
  product: Product;

  /**
   * Call-to-action button text (e.g., "Buy now").
   */
  buttonText: string;

  /**
   * Optional additional CSS classes.
   */
  className?: string;
}
