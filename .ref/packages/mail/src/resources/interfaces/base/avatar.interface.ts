import type { VariantProps } from 'class-variance-authority';
import type { avatarVariants } from '@resources/components/base/avatar';

/**
 * Props for the Avatar component.
 *
 * Extends the variant props from CVA to provide type-safe
 * size and shape options along with standard image properties.
 */
export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  /**
   * The URL or path to the avatar image.
   *
   * @example "https://example.com/avatar.jpg"
   * @example "/static/user-avatar.png"
   */
  src: string;

  /**
   * Alternative text for the avatar image.
   *
   * Used for accessibility and displayed when the image fails to load.
   *
   * @example "John Doe"
   * @example "User Avatar"
   */
  alt: string;

  /**
   * Optional link URL when the avatar is clicked.
   *
   * Wraps the avatar in a link element if provided.
   *
   * @example "https://example.com/profile"
   * @example "/user/john-doe"
   */
  href?: string;

  /**
   * Additional CSS classes to apply to the avatar container.
   *
   * These classes will be merged with the variant classes.
   *
   * @example "mr-4"
   * @example "border-2 border-white"
   */
  className?: string;
}
