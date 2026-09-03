/**
 * Markdown component interface.
 *
 * This file contains interface definitions for the EmailMarkdown component,
 * which renders markdown content as HTML.
 *
 * @module email-templates/base
 */

/**
 * Props for the EmailMarkdown component.
 *
 * Renders markdown content as HTML.
 */
export interface MarkdownProps {
  /**
   * Markdown content string.
   *
   * @example "# Hello\\n\\nThis is **bold** text"
   */
  children: string;

  /**
   * Custom styles for markdown elements.
   *
   * @example { h1: { color: 'red' } }
   */
  markdownCustomStyles?: Record<string, React.CSSProperties>;

  /**
   * Container styles.
   */
  markdownContainerStyles?: React.CSSProperties;
}
