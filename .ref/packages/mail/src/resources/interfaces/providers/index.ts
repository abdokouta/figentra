/**
 * Provider Interfaces.
 *
 * This module exports all provider-related interface definitions.
 * Providers wrap email templates with context for internationalization
 * and styling.
 *
 * @module interfaces/providers
 */

// Export main provider interface
export type { EmailProviderProps } from './email-provider-props.interface';

// Export sub-provider interfaces
export type { TailwindProviderProps } from './tailwind-provider-props.interface';
export type { IntlProviderProps } from './intl-provider-props.interface';

// Legacy export for backwards compatibility
export type { EmailProviderProps as ProviderProps } from './email-provider-props.interface';
