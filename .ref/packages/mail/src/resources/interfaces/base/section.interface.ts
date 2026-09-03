import type { VariantProps } from 'class-variance-authority';
import type { sectionVariants } from '@resources/components/base/section';

/**
 * Props for the Section component.
 *
 * Extends the variant props from CVA to provide type-safe
 * spacing options along with standard section properties.
 */
export interface SectionProps extends VariantProps<typeof sectionVariants> {
  /**
   * The section content.
   *
   * @example <Text>Section content</Text>
   */
  children: React.ReactNode;

  /**
   * Additional CSS classes to apply to the section.
   *
   * @example "bg-gray-50"
   * @example "border-t border-gray-200"
   */
  className?: string;
}
