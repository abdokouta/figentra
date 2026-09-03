/**
 * Email Template Interfaces.
 *
 * This module exports all TypeScript interfaces and type definitions
 * used across email template components. Each interface is defined in
 * its own file for better organization and maintainability.
 *
 * @module email-templates/interfaces/base
 */

// ============================================================================
// Component Interfaces
// ============================================================================

// Export component-specific interfaces
export type { ButtonProps } from './button.interface';
export type { TextProps } from './text.interface';
export type { HeadingProps } from './heading.interface';
export type { AvatarProps } from './avatar.interface';
export type { CodeInlineProps } from './code-inline.interface';
export type { DividerProps } from './divider.interface';
export type { LinkProps } from './link.interface';
export type { ContainerProps } from './container.interface';
export type { SectionProps } from './section.interface';
export type { ImageProps } from './image.interface';

// ============================================================================
// Wrapper Component Interfaces
// ============================================================================

export type { HtmlProps } from './html.interface';
export type { HeadProps } from './head.interface';
export type { BodyProps } from './body.interface';
export type { PreviewProps } from './preview.interface';
export type { RowProps } from './row.interface';
export type { ColumnProps } from './column.interface';
export type { FontProps } from './font.interface';
export type { MarkdownProps } from './markdown.interface';
export type { CodeBlockProps } from './code-block.interface';
export type { WebFont } from './web-font.interface';

// ============================================================================
// Common Interfaces
// ============================================================================

export type { Logo } from './logo.interface';
export type { MenuItem } from './menu-item.interface';
export type { SocialLink } from './social-link.interface';
export type { ImageConfig } from './image-config.interface';
export type { CompanyInfo } from './company-info.interface';
export type { ContactInfo } from './contact-info.interface';
export type { Author } from './author.interface';
