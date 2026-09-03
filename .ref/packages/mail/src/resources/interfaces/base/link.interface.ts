import type { VariantProps } from 'class-variance-authority';
import type { linkVariants } from '@resources/components/base/link';

/**
 * Props for the Link component.
 *
 * Extends the variant props from CVA to provide type-safe
 * variant options along with standard link properties.
 */
export interface LinkProps extends VariantProps<typeof linkVariants> {
  /**
   * The URL the link should navigate to.
   *
   * @example "https://example.com"
   * @example "/about"
   */
  href: string;

  /**
   * The link content.
   *
   * @example "Visit our website"
   * @example <><Icon /> Learn More</>
   */
  children: React.ReactNode;

  /**
   * Additional CSS classes to apply to the link.
   *
   * @example "ml-2"
   * @example "hover:underline"
   */
  className?: string;

  /**
   * Optional target attribute for the link.
   *
   * @default undefined
   * @example "_blank"
   */
  target?: '_blank' | '_self' | '_parent' | '_top';

  /**
   * Optional rel attribute for the link.
   *
   * @default undefined
   * @example "noopener noreferrer"
   */
  rel?: string;
}
