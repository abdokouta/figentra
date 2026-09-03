import type { PricingPlan } from './pricing-plan.interface';

/**
 * Props for PricingTwoTiers component.
 */
export interface PricingTwoTiersProps {
  /**
   * Main heading.
   */
  heading: string;

  /**
   * Description text.
   */
  description: string;

  /**
   * Two pricing plans to display.
   */
  plans: [PricingPlan, PricingPlan];

  /**
   * Optional additional CSS classes.
   */
  className?: string;
}
