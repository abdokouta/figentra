/**
 * Pricing Plan Interface.
 *
 * @module interfaces/pricing
 */

/**
 * Pricing plan structure.
 */
export interface PricingPlan {
  /**
   * Plan name (e.g., "Hobby", "Enterprise").
   */
  title: string;

  /**
   * Monthly price in dollars.
   */
  price: number;

  /**
   * Plan description.
   */
  description: string;

  /**
   * List of features included in the plan.
   */
  features: string[];

  /**
   * Call-to-action button text.
   */
  buttonText: string;

  /**
   * Button URL.
   */
  buttonUrl: string;

  /**
   * Whether this plan is highlighted/emphasized.
   */
  highlighted?: boolean;
}
