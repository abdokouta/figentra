import type { Author } from '../../base/author.interface';

/**
 * Props for ArticleSingleAuthor component.
 *
 * Author bio section with avatar and social links.
 */
export interface ArticleSingleAuthorProps {
  /**
   * Author information.
   */
  author: Author;

  /**
   * Optional additional CSS classes.
   */
  className?: string;
}
