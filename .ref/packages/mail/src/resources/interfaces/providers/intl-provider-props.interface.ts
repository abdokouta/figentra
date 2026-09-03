import type * as React from 'react';

/**
 * Props for the IntlProvider component
 */
export interface IntlProviderProps {
  /**
   * The locale for internationalization (e.g., 'en', 'ar')
   */
  locale: string;

  /**
   * The content to be displayed
   */
  children: React.ReactNode;
}
