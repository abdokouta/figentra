import type { FeatureItem } from './feature-item.interface';
import type { NumberedFeatureItem } from './numbered-feature-item.interface';

/**
 * Props for feature components with header.
 */
export interface FeaturesWithHeaderProps {
  /**
   * Main heading.
   */
  heading: string;

  /**
   * Description text.
   */
  description: string;

  /**
   * Array of feature items.
   */
  features: FeatureItem[] | NumberedFeatureItem[];

  /**
   * Optional additional CSS classes.
   */
  className?: string;
}
