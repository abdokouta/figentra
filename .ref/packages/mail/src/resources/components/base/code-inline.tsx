import React from 'react';

import { cva } from 'class-variance-authority';
import { CodeInline as ReactCodeInline } from '@react-email/components';
import { cn } from '@resources/utils/cn';
import type { CodeInlineProps } from '@resources/interfaces/base/code-inline.interface';

/**
 * Code inline variant styles configuration.
 *
 * This CVA configuration defines the theme options available for
 * the CodeInline component. Each theme provides appropriate
 * background, text color, and styling for inline code display.
 *
 * Themes:
 * - default: Light gray background for subtle inline code
 * - primary: Indigo-tinted background for emphasized code
 * - success: Green-tinted background for successful operations
 * - error: Red-tinted background for error messages
 */
export const codeInlineVariants = cva(
  // Base styles - consistent padding and monospace font
  'rounded-[6px] px-[4px] py-[2px] font-mono text-[14px]',
  {
    variants: {
      /**
       * Theme variant of the inline code.
       */
      theme: {
        /**
         * Default theme - Light gray background, neutral.
         */
        default: 'bg-gray-200 text-gray-800',

        /**
         * Primary theme - Indigo background, emphasized.
         */
        primary: 'bg-indigo-100 text-indigo-800',

        /**
         * Success theme - Green background, for successful operations.
         */
        success: 'bg-green-100 text-green-800',

        /**
         * Error theme - Red background, for error messages.
         */
        error: 'bg-red-100 text-red-800',
      },
    },

    // Default variant
    defaultVariants: {
      theme: 'default',
    },
  },
);

/**
 * CodeInline component for email templates.
 *
 * An inline code component for displaying code snippets, commands,
 * or technical terms within body text. Provides visual distinction
 * with monospace font and background highlighting.
 *
 * Features:
 * - Four theme variants (default, primary, success, error)
 * - Monospace font for code clarity
 * - Compact padding for inline use
 * - Email client compatibility
 * - Type-safe variant props
 * - Custom className support
 *
 * @param props - Component properties
 * @returns Rendered inline code component
 *
 * @example
 * ```tsx
 * // Default inline code
 * <Text>
 *   Install with <CodeInline>npm install</CodeInline> command.
 * </ReactText>
 *
 * // Primary theme inline code
 * <Text>
 *   Use the <CodeInline theme="primary">@react-email/components</CodeInline> package.
 * </ReactText>
 *
 * // Success theme for successful commands
 * <Text>
 *   Build completed: <CodeInline theme="success">SUCCESS</CodeInline>
 * </ReactText>
 *
 * // Error theme for error codes
 * <Text>
 *   Error: <CodeInline theme="error">404 Not Found</CodeInline>
 * </ReactText>
 * ```
 */
export const CodeInline: React.FC<CodeInlineProps> = ({ theme, children, className }) => {
  // Combine variant classes with custom className
  const combinedClassName = cn(codeInlineVariants({ theme }), className);

  // Render the CodeInline component with merged classes
  return <ReactCodeInline className={combinedClassName}>{children}</ReactCodeInline>;
};
