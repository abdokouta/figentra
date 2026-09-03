import type { VariantProps } from 'class-variance-authority';

import type { textVariants } from '@resources/components/base/text';

/**
 * Props for the Text component.
 *
 * Extends the variant props from CVA to provide type-safe
 * size, color, align, and weight options along with standard
 * text properties.
 */
export interface TextProps extends VariantProps<typeof textVariants> {
  /**
   * The text content.
   *
   * Can be text, React elements, or a combination of both.
   *
   * @example "This is some text"
   * @example <><strong>Bold</strong> and normal text</>
   */
  children: React.ReactNode;

  /**
   * Additional CSS classes to apply to the text.
   *
   * These classes will be merged with the variant classes,
   * allowing for custom styling while maintaining variant behavior.
   *
   * @example "mb-4"
   * @example "first-letter:text-2xl"
   */
  className?: string;
}
