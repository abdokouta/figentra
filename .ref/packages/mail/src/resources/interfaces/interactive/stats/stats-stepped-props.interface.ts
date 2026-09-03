import type { SteppedStatItem } from './stepped-stat-item.interface';

/**
 * Props for StatsStepped component (stacked cards).
 */
export interface StatsSteppedProps {
  /**
   * Array of stat items with different heights/colors.
   */
  stats: SteppedStatItem[];

  /**
   * Optional additional CSS classes.
   */
  className?: string;
}
