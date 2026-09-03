/**
 * Article Image Background Props Interface.
 *
 * @module interfaces/article
 */

/**
 * Props for ArticleImageBackground component.
 *
 * Text overlaid on background image.
 */
export interface ArticleImageBackgroundProps {
  /**
   * Background image URL.
   */
  backgroundImage: string;

  /**
   * Article category or label.
   */
  category: string;

  /**
   * Article title/heading.
   */
  title: string;

  /**
   * Article description/excerpt.
   */
  description: string;

  /**
   * Call-to-action button text.
   */
  buttonText: string;

  /**
   * Button URL.
   */
  buttonUrl: string;

  /**
   * Optional additional CSS classes.
   */
  className?: string;
}
