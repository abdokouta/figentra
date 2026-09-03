import { PrismLanguage, Theme } from '@react-email/components';

/**
 * Props for the EmailCodeBlock component.
 *
 * Displays code with syntax highlighting.
 */
export interface CodeBlockProps {
  /**
   * Code content string.
   *
   * @example "const greeting = 'Hello';"
   */
  code: string;

  /**
   * Programming language for syntax highlighting.
   *
   * @example "javascript"
   * @example "python"
   */
  language: PrismLanguage;

  /**
   * Whether to show line numbers.
   *
   * @default false
   */
  lineNumbers?: boolean;

  /**
   * Syntax highlighting theme.
   */
  theme: Theme;

  /**
   * Font family for code.
   *
   * @example "'Monaco', monospace"
   */
  fontFamily?: string;

  /**
   * Additional CSS classes.
   */
  className?: string;
}
