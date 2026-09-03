import type { VariantProps } from 'class-variance-authority';
import type { codeInlineVariants } from '@resources/components/base/code-inline';

/**
 * Props for the CodeInline component.
 *
 * Extends the variant props from CVA to provide type-safe
 * theme options along with standard code properties.
 */
export interface CodeInlineProps extends VariantProps<typeof codeInlineVariants> {
  /**
   * The code content to display.
   *
   * @example "npm install"
   * @example "const greeting = 'Hello';"
   */
  children: React.ReactNode;

  /**
   * Additional CSS classes to apply to the code element.
   *
   * These classes will be merged with the variant classes.
   *
   * @example "mx-1"
   * @example "text-xs"
   */
  className?: string;
}
