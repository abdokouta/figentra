/**
 * Review Rating Breakdown Interface.
 *
 * @module interfaces/feedback
 */

/**
 * Review rating breakdown data.
 */
export interface ReviewRatingBreakdown {
  /**
   * Star rating (1-5).
   */
  rating: number;

  /**
   * Number of reviews with this rating.
   */
  count: number;
}
