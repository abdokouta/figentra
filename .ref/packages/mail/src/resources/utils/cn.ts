import { clsx, type ClassValue } from 'clsx';

/**
 * Combines multiple class names into a single string.
 *
 * This function uses the `clsx` library to merge class names,
 * handling conditional classes, arrays, and objects efficiently.
 * It's particularly useful for combining variant classes with
 * custom className props.
 *
 * @param inputs - Variable number of class values to combine
 * @returns A single merged class name string
 *
 * @example
 * ```typescript
 * // Basic usage
 * cn('text-red-500', 'font-bold')
 * // => 'text-red-500 font-bold'
 *
 * // With conditional classes
 * cn('base-class', isActive && 'active-class')
 * // => 'base-class active-class' (if isActive is true)
 *
 * // With arrays and objects
 * cn(['class1', 'class2'], { 'class3': true, 'class4': false })
 * // => 'class1 class2 class3'
 *
 * // Combining variant classes with custom className
 * cn(buttonVariants({ variant, size }), className)
 * // => Merged variant and custom classes
 * ```
 *
 * @see {@link https://github.com/lukeed/clsx clsx documentation}
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
