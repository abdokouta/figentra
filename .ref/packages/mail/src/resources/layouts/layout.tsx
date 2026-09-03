import React from 'react';

import { EmailProvider } from '@resources/providers';
import type { LayoutProps } from '@resources/interfaces/layout/layouts.interface';
import { Html, Head, Body, Preview, Container } from '@resources/components/base';

export const Layout: React.FC<LayoutProps> = ({
  children,
  preview,
  locale = 'en',
  tailwindConfig,
  lang,
  dir,
  containerClassName,
  bodyClassName,
}) => {
  return (
    <EmailProvider locale={locale} tailwindConfig={tailwindConfig}>
      <Html lang={lang || locale} dir={dir}>
        <Head />
        {preview && <Preview>{preview}</Preview>}
        <Body className={bodyClassName}>
          <Container className={containerClassName}>{children}</Container>
        </Body>
      </Html>
    </EmailProvider>
  );
};
