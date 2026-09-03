import React from 'react';
import type { HeaderSideMenuProps } from '@resources/interfaces';
import { Section, Row, Column, Image, Link } from '@resources/components/base';

/**
 * HeaderSideMenu component.
 *
 * Creates a header with:
 * - Logo aligned to the left (80% width)
 * - Navigation menu aligned to the right
 * - Professional, traditional layout
 *
 * This layout works well for business emails and newsletters
 * that need a more formal appearance.
 *
 * @param props - Component properties
 * @returns Rendered header component
 *
 * @example
 * ```tsx
 * <HeaderSideMenu
 *   logo={{
 *     src: 'https://example.com/logo.png',
 *     alt: 'Company Logo',
 *     height: 42,
 *   }}
 *   menuItems={[
 *     { label: 'About', href: '/about' },
 *     { label: 'Company', href: '/company' },
 *     { label: 'Blog', href: '/blog' },
 *   ]}
 * />
 * ```
 */
export const HeaderSideMenu: React.FC<HeaderSideMenuProps> = ({ logo, menuItems, className }) => {
  return (
    <Section spacing="lg" className={className}>
      <Row>
        {/* Logo Column - 80% width */}
        <Column className="w-[80%]">
          <Image
            src={logo.src}
            alt={logo.alt}
            height={logo.height || 42}
            width={logo.width}
            display="inline"
          />
        </Column>

        {/* Menu Column - Aligned Right */}
        <Column align="right">
          <Row>
            {menuItems.map((item, index) => (
              <Column key={`${item.label}-${index}`} className="px-[8px]">
                <Link variant="secondary" href={item.href}>
                  {item.label}
                </Link>
              </Column>
            ))}
          </Row>
        </Column>
      </Row>
    </Section>
  );
};
