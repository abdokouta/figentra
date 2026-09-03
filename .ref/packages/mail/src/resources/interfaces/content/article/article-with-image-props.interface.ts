import type { ImageConfig } from '../../base/image-config.interface';

/**
 * Props for ArticleWithImage component.
 *
 * Full-width image at top with centered text content below.
 */
export interface ArticleWithImageProps {
  /**
   * Article featured image.
   */
  image: ImageConfig;

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
