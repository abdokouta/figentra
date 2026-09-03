import type { VariantProps } from 'class-variance-authority';
import type { headingVariants } from '@resources/components/base/heading';

/**
 * Props for the Heading component.
 *
 * Extends the variant props from CVA to provide type-safe
 * level, color, align, and weight options along with standard
 * heading properties.
 */
export interface HeadingProps extends VariantProps<typeof headingVariants> {
  /**
   * The heading content.
   *
   * Can be text, React elements, or a combination of both.
   *
   * @example "Welcome to Our Platform"
   * @example <><Icon /> Section Title</>
   */
  children: React.ReactNode;

  /**
   * Additional CSS classes to apply to the heading.
   *
   * These classes will be merged with the variant classes,
   * allowing for custom styling while maintaining variant behavior.
   *
   * @example "mb-6"
   * @example "tracking-tight"
   */
  className?: string;

  /**
   * HTML heading element to render.
   *
   * Determines the semantic level and default styling of the heading.
   *
   * @default "h2"
   * @example "h1"
   * @example "h3"
   */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}
