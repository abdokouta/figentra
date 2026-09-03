import type { TailwindConfig } from '@react-email/components';

/**
 * Props for the Layout component.
 *
 * Basic email layout with container wrapping.
 */
export interface LayoutProps {
  /**
   * Email content.
   */
  children: React.ReactNode;

  /**
   * Preview text shown in email client.
   */
  preview?: string;

  /**
   * Locale for internationalization.
   * @default 'en'
   */
  locale?: string;

  /**
   * Tailwind CSS configuration.
   */
  tailwindConfig?: TailwindConfig;

  /**
   * HTML lang attribute.
   */
  lang?: string;

  /**
   * Text direction.
   */
  dir?: 'ltr' | 'rtl';

  /**
   * Container CSS classes.
   */
  containerClassName?: string;

  /**
   * Body CSS classes.
   */
  bodyClassName?: string;
}

/**
 * Props for the LayoutWithHeaderFooter component.
 *
 * Email layout with optional header and footer sections.
 */
export interface LayoutWithHeaderFooterProps {
  /**
   * Email content.
   */
  children: React.ReactNode;

  /**
   * Optional header component.
   */
  header?: React.ReactNode;

  /**
   * Optional footer component.
   */
  footer?: React.ReactNode;

  /**
   * Preview text shown in email client.
   */
  preview?: string;

  /**
   * Locale for internationalization.
   * @default 'en'
   */
  locale?: string;

  /**
   * Tailwind CSS configuration.
   */
  tailwindConfig?: TailwindConfig;

  /**
   * HTML lang attribute.
   */
  lang?: string;

  /**
   * Text direction.
   */
  dir?: 'ltr' | 'rtl';

  /**
   * Container CSS classes.
   */
  containerClassName?: string;

  /**
   * Body CSS classes.
   */
  bodyClassName?: string;

  /**
   * Content wrapper CSS classes.
   */
  contentClassName?: string;
}
