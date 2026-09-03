import type { ImageConfig } from '../../base/image-config.interface';

/**
 * Props for ArticleImageRight component.
 *
 * Text content on left, image on right in two-column layout.
 */
export interface ArticleImageRightProps {
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
   * Article image displayed on the right.
   */
  image: ImageConfig;

  /**
   * "Read more" link URL.
   */
  readMoreUrl: string;

  /**
   * Optional additional CSS classes.
   */
  className?: string;
}
