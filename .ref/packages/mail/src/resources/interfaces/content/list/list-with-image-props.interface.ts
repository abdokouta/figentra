import type { ListItemWithImage } from './list-item-with-image.interface';

/**
 * Props for ListWithImage component.
 */
export interface ListWithImageProps {
  /**
   * List heading.
   */
  heading: string;

  /**
   * List items with images.
   */
  items: ListItemWithImage[];

  /**
   * Optional additional CSS classes.
   */
  className?: string;
}
