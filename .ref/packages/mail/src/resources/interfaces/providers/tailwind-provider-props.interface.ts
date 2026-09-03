import type { TailwindConfig } from '@react-email/components';

/**
 * Props for the TailwindProvider component.
 *
 * The TailwindProvider wraps email content with Tailwind CSS configuration,
 * enabling utility-first styling in email templates with email client compatibility.
 *
 * @example
 * ```tsx
 * <TailwindProvider config={customConfig}>
 *   <EmailContent />
 * </TailwindProvider>
 * ```
 */
export interface TailwindProviderProps {
  /**
   * The content to be styled with Tailwind CSS.
   */
  children: React.ReactNode;

  /**
   * Custom Tailwind CSS configuration.
   *
   * Provides theme customization including colors, fonts, spacing, and other
   * design tokens. If not provided, uses the default configuration with
   * predefined color palette (primary, secondary, success, danger, warning, info).
   *
   * @default defaultTailwindConfig
   * @see {@link TailwindConfig} for full configuration options
   *
   * @example
   * ```tsx
   * const customConfig = {
   *   theme: {
   *     extend: {
   *       colors: {
   *         brand: '#ff6b6b',
   *       },
   *     },
   *   },
   * };
   * ```
   */
  config?: TailwindConfig;
}
