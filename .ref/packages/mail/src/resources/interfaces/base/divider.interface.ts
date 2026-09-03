import type { VariantProps } from 'class-variance-authority';
import type { dividerVariants } from '@resources/components/base/divider';

/**
 * Props for the Divider component.
 *
 * Extends the variant props from CVA to provide type-safe
 * spacing and style options along with standard divider properties.
 */
export interface DividerProps extends VariantProps<typeof dividerVariants> {
  /**
   * Additional CSS classes to apply to the divider.
   *
   * These classes will be merged with the variant classes.
   *
   * @example "my-8"
   * @example "border-dashed"
   */
  className?: string;
}
