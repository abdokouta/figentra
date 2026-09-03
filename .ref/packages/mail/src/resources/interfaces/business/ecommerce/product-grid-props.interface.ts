import type { Product } from './product.interface';

/**
 * Props for ProductGrid components.
 */
export interface ProductGridProps {
  /**
   * Section heading.
   */
  heading: string;

  /**
   * Section description.
   */
  description: string;

  /**
   * Array of products to display (3 or 4 items).
   */
  products: Product[];

  /**
   * Call-to-action button text for each product.
   */
  buttonText: string;

  /**
   * Optional additional CSS classes.
   */
  className?: string;
}
