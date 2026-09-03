import type { PricingPlan } from './pricing-plan.interface';

/**
 * Props for PricingSimple component (single plan).
 */
export interface PricingSimpleProps {
  /**
   * Pricing plan details.
   */
  plan: PricingPlan;

  /**
   * Optional footer note text.
   */
  footerNote?: string;

  /**
   * Optional additional CSS classes.
   */
  className?: string;
}
