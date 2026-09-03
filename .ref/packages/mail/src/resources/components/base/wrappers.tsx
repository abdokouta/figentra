import React from 'react';
import {
  Html as ReactHtml,
  Head as ReactHead,
  Body as ReactBody,
  Preview as ReactPreview,
  Row as ReactRow,
  Column as ReactColumn,
} from '@react-email/components';

import type { RowProps } from '@resources/interfaces/base/row.interface';
import type { HtmlProps } from '@resources/interfaces/base/html.interface';
import type { HeadProps } from '@resources/interfaces/base/head.interface';
import type { BodyProps } from '@resources/interfaces/base/body.interface';
import type { ColumnProps } from '@resources/interfaces/base/column.interface';
import type { PreviewProps } from '@resources/interfaces/base/preview.interface';

/**
 * EmailHtml component for email templates.
 *
 * Root HTML wrapper for email templates. Should be the outermost
 * component in any email template structure.
 *
 * @param props - Component properties
 * @returns Rendered HTML wrapper
 *
 * @example
 * ```tsx
 * <EmailHtml lang="en">
 *   <EmailHead />
 *   <EmailBody>
 *     {/* Email content *\/}
 *   </EmailBody>
 * </EmailHtml>
 * ```
 */
export const Html: React.FC<HtmlProps> = ({ children, lang = 'en', dir = 'ltr', className }) => {
  return (
    <ReactHtml lang={lang} dir={dir} className={className}>
      {children}
    </ReactHtml>
  );
};

/**
 * EmailHead component for email templates.
 *
 * Contains metadata, styles, fonts, and other head elements
 * for the email template.
 *
 * @param props - Component properties
 * @returns Rendered head section
 *
 * @example
 * ```tsx
 * <EmailHead>
 *   <title>Email Title</title>
 *   <EmailFont fontFamily="Roboto" />
 * </EmailHead>
 * ```
 */
export const Head: React.FC<HeadProps> = ({ children }) => {
  return <ReactHead>{children}</ReactHead>;
};

/**
 * EmailBody component for email templates.
 *
 * Main body wrapper for email content. Contains all visible
 * email content and should be placed inside EmailHtml.
 *
 * @param props - Component properties
 * @returns Rendered body wrapper
 *
 * @example
 * ```tsx
 * <EmailBody className="bg-gray-50">
 *   <Container>
 *     <Heading>Welcome!</ReactHeading>
 *     <Text>Your content here</ReactText>
 *   </ReactContainer>
 * </EmailBody>
 * ```
 */
export const Body: React.FC<BodyProps> = ({ children, className }) => {
  return <ReactBody className={className}>{children}</ReactBody>;
};

/**
 * EmailPreview component for email templates.
 *
 * Sets the preview text that appears in email client inboxes
 * before the email is opened. This text is crucial for email
 * open rates.
 *
 * @param props - Component properties
 * @returns Rendered preview text
 *
 * @example
 * ```tsx
 * <EmailPreview>
 *   Welcome to our newsletter! This month's highlights...
 * </EmailPreview>
 * ```
 */
export const Preview: React.FC<PreviewProps> = ({ children }) => {
  return <ReactPreview>{children}</ReactPreview>;
};

/**
 * Row component for email templates.
 *
 * Row container for creating multi-column layouts. Used in
 * conjunction with Column components to create responsive
 * grid structures.
 *
 * @param props - Component properties
 * @returns Rendered row container
 *
 * @example
 * ```tsx
 * <ReactRow className="mt-4">
 *   <ReactColumn className="w-1/2">
 *     <Text>Left column</ReactText>
 *   </ReactColumn>
 *   <ReactColumn className="w-1/2">
 *     <Text>Right column</ReactText>
 *   </ReactColumn>
 * </ReactRow>
 * ```
 */
export const Row: React.FC<RowProps> = ({ children, className }) => {
  return <ReactRow className={className}>{children}</ReactRow>;
};

/**
 * Column component for email templates.
 *
 * Column component for grid layouts. Must be used within an
 * Row component. Supports alignment and width customization
 * through className prop.
 *
 * @param props - Component properties
 * @returns Rendered column container
 *
 * @example
 * ```tsx
 * <Row>
 *   <ReactColumn className="w-1/3" align="center">
 *     <Image src="/img1.jpg" alt="Image 1" />
 *   </ReactColumn>
 *   <ReactColumn className="w-2/3">
 *     <Text>Description text</ReactText>
 *   </ReactColumn>
 * </ReactRow>
 * ```
 */
export const Column: React.FC<ColumnProps> = ({ children, className, align }) => {
  return (
    <ReactColumn className={className} align={align}>
      {children}
    </ReactColumn>
  );
};
