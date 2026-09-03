import type { Author } from '../../base/author.interface';

/**
 * Props for TestimonialSimple component.
 */
export interface TestimonialSimpleProps {
  /**
   * Testimonial quote text.
   */
  quote: string;

  /**
   * Author information (name, title, avatar).
   */
  author: Author;

  /**
   * Optional additional CSS classes.
   */
  className?: string;
}
