import type { CartItem } from './cart-item.interface';

/**
 * Props for ProductCheckout component (cart abandonment email).
 */
export interface ProductCheckoutProps {
  /**
   * Main heading text.
   */
  heading: string;

  /**
   * Cart items.
   */
  items: CartItem[];

  /**
   * Call-to-action button text.
   */
  buttonText: string;

  /**
   * Checkout URL.
   */
  checkoutUrl: string;

  /**
   * Optional additional CSS classes.
   */
  className?: string;
}
