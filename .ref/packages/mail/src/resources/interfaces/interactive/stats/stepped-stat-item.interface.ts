import type { StatItem } from './stat-item.interface';

/**
 * Stepped stat item with background color.
 */
export interface SteppedStatItem extends StatItem {
  /**
   * Background color variant.
   */
  variant: 'light' | 'dark' | 'primary';
}
