import React from 'react';

import { Tailwind } from '@react-email/components';
import type { TailwindConfig } from '@react-email/components';
import type { TailwindProviderProps } from '@resources/interfaces/providers';

/**
 * Default Tailwind CSS configuration for email templates.
 *
 * This configuration provides a standard color palette optimized for email templates,
 * with colors chosen for good compatibility across email clients.
 *
 * Colors included:
 * - primary: Indigo (#4f46e5) - For primary actions and highlights
 * - secondary: Gray (#6b7280) - For secondary text and elements
 * - success: Green (#10b981) - For success messages and positive actions
 * - danger: Red (#ef4444) - For errors and destructive actions
 * - warning: Amber (#f59e0b) - For warnings and caution messages
 * - info: Blue (#3b82f6) - For informational messages
 *
 * @constant
 * @type {TailwindConfig}
 *
 * @example
 * ```tsx
 * // Use default config
 * <TailwindProvider config={defaultTailwindConfig}>
 *   <EmailContent />
 * </TailwindProvider>
 * ```
 *
 * @example
 * ```tsx
 * // Extend default config with custom colors
 * const customConfig = {
 *   ...defaultTailwindConfig,
 *   theme: {
 *     extend: {
 *       ...defaultTailwindConfig.theme?.extend,
 *       colors: {
 *         ...defaultTailwindConfig.theme?.extend?.colors,
 *         brand: '#ff6b6b',
 *       },
 *     },
 *   },
 * };
 * ```
 */
export const defaultTailwindConfig: TailwindConfig = {
  theme: {
    extend: {
      colors: {
        primary: '#4f46e5', // Indigo - Primary actions
        secondary: '#6b7280', // Gray - Secondary elements
        success: '#10b981', // Green - Success states
        danger: '#ef4444', // Red - Error states
        warning: '#f59e0b', // Amber - Warning states
        info: '#3b82f6', // Blue - Informational states
      },
    },
  },
};

/**
 * TailwindProvider wraps email content with Tailwind CSS styling.
 *
 * This component enables the use of Tailwind utility classes in email templates
 * while ensuring the output is compatible with email clients. It converts
 * Tailwind classes to inline styles, which is essential for email rendering.
 *
 * The provider uses React Email's Tailwind component under the hood, which
 * handles the conversion of utility classes to inline styles automatically.
 *
 * @component
 * @param {TailwindProviderProps} props - The component props
 * @returns {JSX.Element} The TailwindProvider component
 *
 * @example
 * ```tsx
 * // Basic usage with default configuration
 * <TailwindProvider>
 *   <div className="bg-primary text-white p-4">
 *     Styled email content
 *   </div>
 * </TailwindProvider>
 * ```
 *
 * @example
 * ```tsx
 * // With custom configuration
 * const customConfig = {
 *   theme: {
 *     extend: {
 *       colors: {
 *         brand: '#ff6b6b',
 *         accent: '#4ecdc4',
 *       },
 *       spacing: {
 *         '72': '18rem',
 *       },
 *     },
 *   },
 * };
 *
 * <TailwindProvider config={customConfig}>
 *   <div className="bg-brand text-white p-72">
 *     Custom styled content
 *   </div>
 * </TailwindProvider>
 * ```
 */
export const TailwindProvider: React.FC<TailwindProviderProps> = ({
  children,
  config = defaultTailwindConfig,
}) => {
  // Use React Email's Tailwind component to convert utility classes to inline styles
  return <Tailwind config={config}>{children}</Tailwind>;
};
