/**
 * Email Template Providers.
 *
 * This module exports provider components and their types for wrapping
 * email templates with necessary context (i18n, styling).
 *
 * Providers available:
 * - EmailProvider: Main provider combining IntlProvider and TailwindProvider
 * - IntlProvider: Internationalization provider for multi-language support
 * - TailwindProvider: Styling provider for Tailwind CSS utility classes
 *
 * @module providers
 *
 * @example
 * ```tsx
 * import { EmailProvider } from '@resources/providers';
 *
 * function WelcomeEmail() {
 *   return (
 *     <EmailProvider locale="en">
 *       <div className="bg-primary text-white p-4">
 *         Welcome!
 *       </div>
 *     </EmailProvider>
 *   );
 * }
 * ```
 */

// Main provider - combines i18n and styling
export { EmailProvider } from './email.provider';

// Provider types - import from interfaces for type safety
export type { EmailProviderProps } from '@resources/interfaces/providers';
export type { IntlProviderProps } from '@resources/interfaces/providers';
export type { TailwindProviderProps } from '@resources/interfaces/providers';

// Sub-providers - can be used independently if needed
export { IntlProvider } from '@resources/providers/intl.provider';
export { TailwindProvider, defaultTailwindConfig } from '@resources/providers/tailwind.provider';
