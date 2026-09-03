import type { ReviewRatingBreakdown } from './review-rating-breakdown.interface';

/**
 * Props for FeedbackReviews component.
 */
export interface FeedbackReviewsProps {
  /**
   * Overall rating (e.g., "4 out of 5 stars").
   */
  overallRating: string;

  /**
   * Rating breakdown by star level.
   */
  ratings: ReviewRatingBreakdown[];

  /**
   * Total number of reviews.
   */
  totalReviews: number;

  /**
   * Call-to-action button text.
   */
  ctaText: string;

  /**
   * CTA button URL.
   */
  ctaUrl: string;

  /**
   * Optional additional CSS classes.
   */
  className?: string;
}
