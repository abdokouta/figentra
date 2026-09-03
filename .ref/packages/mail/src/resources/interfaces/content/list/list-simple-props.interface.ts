import type { ListItem } from './list-item.interface';

/**
 * Props for ListSimple component (numbered list).
 */
export interface ListSimpleProps {
  /**
   * List heading.
   */
  heading: string;

  /**
   * List items.
   */
  items: ListItem[];

  /**
   * Optional additional CSS classes.
   */
  className?: string;
}
