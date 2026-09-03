import type { TailwindConfig } from '@react-email/components';

/**
 * Props for the EmailProvider component.
 *
 * The EmailProvider is the main wrapper component that combines internationalization
 * (IntlProvider) and Tailwind CSS styling (TailwindProvider) for email templates.
 * It provides a unified interface for configuring both locale and styling.
 *
 * @example
 * ```tsx
 * <EmailProvider locale="en" tailwindConfig={customConfig}>
 *   <EmailTemplate />
 * </EmailProvider>
 * ```
 */
export interface EmailProviderProps {
  /**
   * The email template content to be wrapped by the provider.
   *
   * All email components and content should be children of this provider
   * to have access to internationalization and styling context.
   */
  children: React.ReactNode;

  /**
   * The locale for internationalization.
   *
   * Determines which language translations to use for the email template.
   * Supported locales must have corresponding message files in the i18n directory.
   *
   * @default "en"
   * @example "en" | "es" | "fr" | "de" | "ja"
   */
  locale?: string;

  /**
   * Custom Tailwind CSS configuration.
   *
   * Allows customization of the Tailwind theme, including colors, spacing,
   * typography, and other design tokens used throughout the email template.
   * If not provided, uses the default configuration with a predefined color
   * palette suitable for email templates.
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
   *         accent: '#4ecdc4',
   *       },
   *       fontFamily: {
   *         sans: ['Inter', 'sans-serif'],
   *       },
   *     },
   *   },
   * };
   * ```
   */
  tailwindConfig?: TailwindConfig;
}
