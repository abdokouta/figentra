/**
 * Stat Item Interface.
 *
 * @module interfaces/stats
 */

/**
 * Single stat item structure.
 */
export interface StatItem {
  /**
   * Stat value (e.g., "42", "10M", "2^276,709:1").
   */
  value: string;

  /**
   * Stat label/description.
   */
  label: string;

  /**
   * Optional secondary description.
   */
  description?: string;
}
