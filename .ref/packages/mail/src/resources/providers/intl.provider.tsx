import React from 'react';

import { IntlProvider as ReactIntlProvider } from 'react-intl';

import { messages } from '@resources/i18n';
import type { IntlProviderProps } from '@resources/interfaces/providers';

/**
 * Custom IntlProvider component that wraps react-intl's IntlProvider
 * and loads messages from JSON files based on the locale.
 *
 * @component
 * @param {IntlProviderProps} props - The component props
 * @returns {JSX.Element} The IntlProvider component
 *
 * @example
 * ```tsx
 * <IntlProvider locale="en">
 *   <MyComponent />
 * </IntlProvider>
 * ```
 */
export const IntlProvider: React.FC<IntlProviderProps> = ({ locale = 'en', children }) => {
  // Default to English if the requested locale isn't available
  const messagesByLocale = messages[locale as keyof typeof messages] || messages.en;

  return (
    <ReactIntlProvider locale={locale} defaultLocale="en" messages={messagesByLocale}>
      {children}
    </ReactIntlProvider>
  );
};
