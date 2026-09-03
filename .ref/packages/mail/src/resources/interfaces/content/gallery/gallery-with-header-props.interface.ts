import type { GalleryItem } from './gallery-item.interface';

/**
 * Props for gallery components with header text.
 */
export interface GalleryWithHeaderProps {
  /**
   * Category or label text.
   */
  category: string;

  /**
   * Main heading.
   */
  title: string;

  /**
   * Description text.
   */
  description: string;

  /**
   * Array of gallery items (images with optional links).
   */
  items: GalleryItem[];

  /**
   * Optional additional CSS classes.
   */
  className?: string;
}
