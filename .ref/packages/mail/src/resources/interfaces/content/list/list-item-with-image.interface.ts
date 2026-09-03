import type { ImageConfig } from '../../base/image-config.interface';
import type { ListItem } from './list-item.interface';

/**
 * List item with image structure.
 */
export interface ListItemWithImage extends ListItem {
  /**
   * Item image.
   */
  image: ImageConfig;

  /**
   * Optional "learn more" link URL.
   */
  learnMoreUrl?: string;
}
