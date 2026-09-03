/**
 * Feedback Survey Props Interface.
 *
 * @module interfaces/feedback
 */

/**
 * Props for FeedbackSurvey component.
 */
export interface FeedbackSurveyProps {
  /**
   * Survey category/label.
   */
  category: string;

  /**
   * Survey heading.
   */
  heading: string;

  /**
   * Survey description.
   */
  description: string;

  /**
   * Base URL for rating submission.
   */
  ratingUrl: string;

  /**
   * Optional additional CSS classes.
   */
  className?: string;
}
