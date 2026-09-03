import type { Product } from './product.interface';

/**
 * Props for ProductImageLeft component (two-column layout).
 */
export interface ProductImageLeftProps {
  /**
   * Product details.
   */
  product: Product;

  /**
   * Call-to-action button text (e.g., "Buy").
   */
  buttonText: string;

  /**
   * Optional additional CSS classes.
   */
  className?: string;
}
