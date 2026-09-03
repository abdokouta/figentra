import type { WebFont } from './web-font.interface';

type FallbackFont =
  | 'Arial'
  | 'Helvetica'
  | 'Verdana'
  | 'Georgia'
  | 'Times New Roman'
  | 'serif'
  | 'sans-serif'
  | 'monospace'
  | 'cursive'
  | 'fantasy';

/**
 * Props for the EmailFont component.
 *
 * Loads custom fonts for email templates.
 */
export interface FontProps {
  /**
   * Font family name.
   *
   * @example "Roboto"
   */
  fontFamily: string;

  /**
   * Fallback font family.
   *
   * @example "Arial, sans-serif"
   */
  fallbackFontFamily: FallbackFont | FallbackFont[];

  /**
   * Web font configuration.
   */
  webFont?: WebFont;

  /**
   * Font weight.
   *
   * @default 400
   */
  fontWeight?: number;

  /**
   * Font style.
   *
   * @default "normal"
   */
  fontStyle?: 'normal' | 'italic';
}
