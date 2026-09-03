import type { VariantProps } from 'class-variance-authority';
import type { containerVariants } from '@resources/components/base/container';

/**
 * Props for the Container component.
 *
 * Extends the variant props from CVA to provide type-safe
 * maxWidth and padding options along with standard container properties.
 */
export interface ContainerProps extends VariantProps<typeof containerVariants> {
  /**
   * The container content.
   *
   * @example <Text>Content goes here</Text>
   */
  children: React.ReactNode;

  /**
   * Additional CSS classes to apply to the container.
   *
   * @example "bg-white"
   * @example "shadow-lg"
   */
  className?: string;
}
