/**
 * Base Email Template Components.
 *
 * This module exports all base email template components, including:
 * 1. Enhanced CVA components with style variants (Button, Text, etc.)
 * 2. Direct exports from React Email components (Html, Container, etc.)
 *
 * This provides a single import location for all email template building blocks
 * with consistent styling and behavior across email clients.
 *
 * ## Enhanced Components (with CVA variants):
 * - Button: Versatile button with multiple variants, sizes, and layouts
 * - Text: Flexible text with size, color, alignment, and weight options
 * - Heading: Semantic headings with level, color, alignment, and weight variants
 * - Avatar: Profile images with size and shape variants
 * - CodeInline: Inline code with theme variants
 * - Divider: Horizontal dividers with spacing and style variants
 * - Link: Hyperlinks with style variants
 *
 * ## Direct React Email Components:
 * - Html: Root HTML wrapper
 * - Head: HTML head section
 * - Body: Email body wrapper
 * - Container: Centered content container
 * - Section: Content section wrapper
 * - Row: Row layout component
 * - Column: Column layout component
 * - Img: Image component
 * - Hr: Horizontal rule (also available as Divider with variants)
 * - CodeBlock: Block-level code display
 * - Markdown: Markdown content renderer
 * - Preview: Email preview text
 * - Font: Custom font loader
 * - Tailwind: Tailwind CSS wrapper
 *
 * @module email-templates/base
 */

// ============================================================================
// Enhanced Components with CVA Variants
// ============================================================================

// Export button component and its types
export { Button, buttonVariants } from './button';

// Export text component and its types
export { Text, textVariants } from './text';

// Export heading component and its types
export { Heading, headingVariants } from './heading';

// Export avatar component and its types
export { Avatar, avatarVariants } from './avatar';

// Export code inline component and its types
export { CodeInline, codeInlineVariants } from './code-inline';

// Export divider component and its types (also exports as Hr below)
export { Divider, dividerVariants } from './divider';

// Export link component and its types
export { Link, linkVariants } from './link';

// Export container component and its types
export { Container, containerVariants } from './container';

// Export section component and its types
export { Section, sectionVariants } from './section';

// Export image component and its types
export { Image, imageVariants } from './image';

// ============================================================================
// Wrapper Components
// ============================================================================

// Export structural wrapper components
export { Html, Head, Body, Preview, Row, Column } from './wrappers';

// Export content components
export { Font, Markdown, CodeBlock } from './content';
