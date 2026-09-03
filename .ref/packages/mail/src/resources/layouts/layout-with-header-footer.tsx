import React from 'react';

import { EmailProvider } from '@resources/providers';
import { Html, Head, Body, Preview, Container } from '@resources/components/base';
import type { LayoutWithHeaderFooterProps } from '@resources/interfaces/layout/layouts.interface';

export const LayoutWithHeaderFooter: React.FC<LayoutWithHeaderFooterProps> = ({
  children,
  header,
  footer,
  preview,
  locale = 'en',
  tailwindConfig,
  lang,
  dir,
  containerClassName,
  bodyClassName,
  contentClassName,
}) => {
  return (
    <EmailProvider locale={locale} tailwindConfig={tailwindConfig}>
      <Html lang={lang || locale} dir={dir}>
        <Head />
        {preview && <Preview>{preview}</Preview>}
        <Body className={bodyClassName}>
          <Container className={containerClassName}>
            {header}
            <div className={contentClassName}>{children}</div>
            {footer}
          </Container>
        </Body>
      </Html>
    </EmailProvider>
  );
};
