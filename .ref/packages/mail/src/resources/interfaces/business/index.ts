/**
 * Business Interfaces.
 *
 * @module interfaces/business
 */

// Export marketing interfaces
export type { BentoGridProduct, BentoGridProps } from './marketing';

// Export ecommerce interfaces
export type {
  Product,
  ProductSingleProps,
  ProductImageLeftProps,
  ProductGridProps,
  CartItem,
  ProductCheckoutProps,
} from './ecommerce';

// Export pricing interfaces
export type { PricingPlan, PricingSimpleProps, PricingTwoTiersProps } from './pricing';

// Export feature interfaces
export type { FeatureItem, NumberedFeatureItem, FeaturesWithHeaderProps } from './feature';
