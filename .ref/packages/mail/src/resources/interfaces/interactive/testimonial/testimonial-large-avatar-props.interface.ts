import type { Author } from '../../base/author.interface';

/**
 * Props for TestimonialLargeAvatar component.
 */
export interface TestimonialLargeAvatarProps {
  /**
   * Testimonial quote text.
   */
  quote: string;

  /**
   * Author information (name, title, large avatar).
   */
  author: Author;

  /**
   * Avatar size (default: 320px).
   */
  avatarSize?: number;

  /**
   * Optional additional CSS classes.
   */
  className?: string;
}
