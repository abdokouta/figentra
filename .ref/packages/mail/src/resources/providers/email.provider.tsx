import React from 'react';

import { IntlProvider } from '@resources/providers/intl.provider';
import { TailwindProvider, defaultTailwindConfig } from '@resources/providers/tailwind.provider';
import type { EmailProviderProps } from '@resources/interfaces/providers';

/**
 * EmailProvider is the main wrapper component for email templates.
 *
 * This component combines internationalization (i18n) and Tailwind CSS styling
 * into a single provider, making it easy to set up email templates with both
 * localization and consistent styling.
 *
 * It wraps the email content with:
 * 1. IntlProvider - Provides internationalization context for multi-language support
 * 2. TailwindProvider - Provides Tailwind CSS styling with email-compatible output
 *
 * @component
 * @param {EmailProviderProps} props - The component props
 * @returns {JSX.Element} The EmailProvider component with nested providers
 *
 * @example
 * ```tsx
 * // Basic usage with default English locale and default Tailwind config
 * <EmailProvider>
 *   <WelcomeEmail />
 * </EmailProvider>
 * ```
 *
 * @example
 * ```tsx
 * // With custom locale
 * <EmailProvider locale="es">
 *   <WelcomeEmail />
 * </EmailProvider>
 * ```
 *
 * @example
 * ```tsx
 * // With custom Tailwind configuration
 * const customConfig = {
 *   theme: {
 *     extend: {
 *       colors: {
 *         brand: '#ff6b6b',
 *       },
 *     },
 *   },
 * };
 *
 * <EmailProvider locale="en" tailwindConfig={customConfig}>
 *   <WelcomeEmail />
 * </EmailProvider>
 * ```
 */
export const EmailProvider: React.FC<EmailProviderProps> = ({
  children,
  locale = 'en',
  tailwindConfig = defaultTailwindConfig,
}) => {
  return (
    // Wrap with IntlProvider for internationalization support
    <IntlProvider locale={locale}>
      {/* Wrap with TailwindProvider for consistent email styling */}
      <TailwindProvider config={tailwindConfig}>{children}</TailwindProvider>
    </IntlProvider>
  );
};
