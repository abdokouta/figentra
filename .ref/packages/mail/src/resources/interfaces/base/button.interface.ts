import type { VariantProps } from 'class-variance-authority';
import type { buttonVariants } from '@resources/components/base/button';

/**
 * Props for the Button component.
 *
 * Extends the variant props from CVA to provide type-safe
 * variant, size, and fullWidth options along with standard
 * button properties.
 */
export interface ButtonProps extends VariantProps<typeof buttonVariants> {
  /**
   * The URL the button should link to.
   *
   * This can be a full URL, relative path, or anchor link.
   *
   * @example "https://example.com/action"
   * @example "/checkout"
   * @example "#section"
   */
  href: string;

  /**
   * The button content.
   *
   * Can be text, React elements, or a combination of both.
   *
   * @example "Click Me"
   * @example <><Icon /> Get Started</>
   */
  children: React.ReactNode;

  /**
   * Additional CSS classes to apply to the button.
   *
   * These classes will be merged with the variant classes,
   * allowing for custom styling while maintaining variant behavior.
   *
   * @example "mt-4"
   * @example "hover:shadow-lg"
   */
  className?: string;

  /**
   * Optional target attribute for the link.
   *
   * Specifies where to open the linked document.
   *
   * @default undefined
   * @example "_blank" - Opens in new window/tab
   * @example "_self" - Opens in same frame (default)
   */
  target?: '_blank' | '_self' | '_parent' | '_top';

  /**
   * Optional rel attribute for the link.
   *
   * Specifies the relationship between the current document
   * and the linked document. Commonly used for security
   * when target="_blank" is set.
   *
   * @default undefined
   * @example "noopener noreferrer"
   */
  rel?: string;
}
