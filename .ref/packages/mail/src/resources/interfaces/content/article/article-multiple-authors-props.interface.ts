import type { Author } from '../../base/author.interface';

/**
 * Props for ArticleMultipleAuthors component.
 *
 * Multiple author bios displayed side by side with dividers.
 */
export interface ArticleMultipleAuthorsProps {
  /**
   * Array of author information (typically 2-3 authors).
   */
  authors: Author[];

  /**
   * Optional additional CSS classes.
   */
  className?: string;
}
