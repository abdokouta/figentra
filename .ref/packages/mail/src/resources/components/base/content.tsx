import React from 'react';
import type { FontProps } from '@resources/interfaces/base/font.interface';
import type { MarkdownProps } from '@resources/interfaces/base/markdown.interface';
import type { CodeBlockProps } from '@resources/interfaces/base/code-block.interface';
import {
  Font as ReactFont,
  Markdown as ReactMarkdown,
  CodeBlock as ReactCodeBlock,
} from '@react-email/components';

/**
 * EmailFont component for email templates.
 *
 * Loads custom web fonts for use in email templates. Place this
 * component in the EmailHead section to make fonts available
 * throughout the email.
 *
 * @param props - Component properties
 * @returns Rendered font loader
 *
 * @example
 * ```tsx
 * <EmailHead>
 *   <EmailFont
 *     fontFamily="Roboto"
 *     fallbackFontFamily="Arial, sans-serif"
 *     webFont={{
 *       url: 'https://fonts.googleapis.com/css2?family=Roboto',
 *       format: 'woff2',
 *     }}
 *     fontWeight={400}
 *     fontStyle="normal"
 *   />
 * </EmailHead>
 * ```
 */
export const Font: React.FC<FontProps> = ({
  fontFamily,
  fallbackFontFamily,
  webFont,
  fontWeight = 400,
  fontStyle = 'normal',
}) => {
  return (
    <ReactFont
      webFont={webFont}
      fontStyle={fontStyle}
      fontFamily={fontFamily}
      fontWeight={fontWeight}
      fallbackFontFamily={fallbackFontFamily}
    />
  );
};

/**
 * EmailMarkdown component for email templates.
 *
 * Renders markdown content as HTML, making it easy to write
 * content-rich emails using markdown syntax. Supports custom
 * styles for markdown elements.
 *
 * @param props - Component properties
 * @returns Rendered markdown content
 *
 * @example
 * ```tsx
 * <EmailMarkdown>
 *   {`
 *   # Welcome!
 *
 *   This is **bold** and this is *italic* text.
 *
 *   - Feature 1
 *   - Feature 2
 *   - Feature 3
 *
 *   [Learn More](https://example.com)
 *   `}
 * </EmailMarkdown>
 *
 * // With custom styles
 * <EmailMarkdown
 *   markdownCustomStyles={{
 *     h1: { color: '#007bff', fontSize: '32px' },
 *     p: { marginBottom: '16px' },
 *   }}
 * >
 *   {markdownContent}
 * </EmailMarkdown>
 * ```
 */
export const Markdown: React.FC<MarkdownProps> = ({
  children,
  markdownCustomStyles,
  markdownContainerStyles,
}) => {
  return (
    <ReactMarkdown
      markdownCustomStyles={markdownCustomStyles}
      markdownContainerStyles={markdownContainerStyles}
    >
      {children}
    </ReactMarkdown>
  );
};

/**
 * EmailCodeBlock component for email templates.
 *
 * Displays code blocks with syntax highlighting. Perfect for
 * technical emails, documentation, and tutorials. Supports multiple
 * programming languages and themes.
 *
 * @param props - Component properties
 * @returns Rendered code block
 *
 * @example
 * ```tsx
 * // Simple code block
 * <EmailCodeBlock
 *   code="const greeting = 'Hello, World!';\nconsole.log(greeting);"
 *   language="javascript"
 * />
 *
 * // With line numbers and custom theme
 * <EmailCodeBlock
 *   code={codeString}
 *   language="python"
 *   lineNumbers
 *   theme={customTheme}
 *   fontFamily="'Fira Code', monospace"
 * />
 *
 * // With custom styling
 * <EmailCodeBlock
 *   code={sqlQuery}
 *   language="sql"
 *   className="rounded-lg border border-gray-300"
 * />
 * ```
 */
export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  lineNumbers = false,
  theme,
  fontFamily,
  className,
}) => {
  return (
    <ReactCodeBlock
      code={code}
      theme={theme}
      language={language}
      className={className}
      fontFamily={fontFamily}
      lineNumbers={lineNumbers}
    />
  );
};
