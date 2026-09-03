import type { StatItem } from './stat-item.interface';

/**
 * Props for StatsSimple component (horizontal row).
 */
export interface StatsSimpleProps {
  /**
   * Array of 3 stat items.
   */
  stats: [StatItem, StatItem, StatItem];

  /**
   * Optional additional CSS classes.
   */
  className?: string;
}
