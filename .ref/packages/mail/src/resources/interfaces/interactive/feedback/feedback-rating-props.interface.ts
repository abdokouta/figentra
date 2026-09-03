/**
 * Feedback Rating Props Interface.
 *
 * @module interfaces/feedback
 */

/**
 * Props for FeedbackRating component (1-5 scale).
 */
export interface FeedbackRatingProps {
  /**
   * Survey question text.
   */
  question: string;

  /**
   * Optional subtitle/description.
   */
  description?: string;

  /**
   * Base URL for rating submission (rating number will be appended).
   */
  ratingUrl: string;

  /**
   * Optional additional CSS classes.
   */
  className?: string;
}
