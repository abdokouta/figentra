import React from 'react';
import type { HeaderCenteredMenuProps } from '@resources/interfaces';
import { Section, Row, Column, Image, Link } from '@resources/components/base';

/**
 * HeaderCenteredMenu component.
 *
 * Creates a header with:
 * - Centered logo at the top
 * - Horizontal navigation menu centered below the logo
 * - Clean, symmetric layout
 *
 * This layout works well for brands that want a balanced,
 * centered appearance in their email headers.
 *
 * @param props - Component properties
 * @returns Rendered header component
 *
 * @example
 * ```tsx
 * <HeaderCenteredMenu
 *   logo={{
 *     src: 'https://example.com/logo.png',
 *     alt: 'Company Logo',
 *     height: 42,
 *   }}
 *   menuItems={[
 *     { label: 'About', href: '/about' },
 *     { label: 'Blog', href: '/blog' },
 *     { label: 'Company', href: '/company' },
 *     { label: 'Features', href: '/features' },
 *   ]}
 * />
 * ```
 */
export const HeaderCenteredMenu: React.FC<HeaderCenteredMenuProps> = ({
  logo,
  menuItems,
  className,
}) => {
  return (
    <Section spacing="lg" className={className}>
      {/* Centered Logo Row */}
      <Row>
        <Column align="center">
          <Image
            src={logo.src}
            alt={logo.alt}
            height={logo.height || 42}
            width={logo.width}
            display="inline"
            className="mx-auto"
          />
        </Column>
      </Row>

      {/* Centered Menu Row */}
      <Row className="mt-[40px]">
        <Column align="center">
          <table>
            <tr>
              {menuItems.map((item, index) => (
                <td key={`${item.label}-${index}`} className="px-[8px]">
                  <Link variant="secondary" href={item.href}>
                    {item.label}
                  </Link>
                </td>
              ))}
            </tr>
          </table>
        </Column>
      </Row>
    </Section>
  );
};
