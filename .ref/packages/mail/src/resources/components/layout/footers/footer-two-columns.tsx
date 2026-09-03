import React from 'react';

import { Section, Row, Column, Image, Text, Link, Divider } from '@resources/components/base';
import type { FooterTwoColumnsProps } from '@resources/interfaces';

/**
 * FooterTwoColumns component.
 *
 * Creates a two-column footer with:
 * - Left column: Company logo, name, tagline, contact info, social links
 * - Right column: Navigation menu items (vertical list)
 * - Full-width copyright text at bottom
 *
 * This layout works best for footers with substantial content
 * that benefits from organized separation.
 *
 * @param props - Component properties
 * @returns Rendered footer component
 *
 * @example
 * ```tsx
 * <FooterTwoColumns
 *   company={{
 *     name: 'Acme Inc.',
 *     logo: {
 *       src: 'https://example.com/logo.png',
 *       alt: 'Acme Logo',
 *       height: 32,
 *     },
 *     tagline: 'Building the future together',
 *   }}
 *   menuItems={[
 *     { label: 'About Us', href: '/about' },
 *     { label: 'Products', href: '/products' },
 *     { label: 'Support', href: '/support' },
 *     { label: 'Privacy', href: '/privacy' },
 *   ]}
 *   socialLinks={[
 *     {
 *       platform: 'twitter',
 *       url: 'https://twitter.com/acme',
 *       icon: 'https://example.com/icons/twitter.png',
 *     },
 *   ]}
 *   contact={{
 *     email: 'hello@acme.com',
 *     phone: '+1 (555) 123-4567',
 *     address: '123 Main St, City, State 12345',
 *   }}
 *   copyright="© 2024 Acme Inc. All rights reserved."
 * />
 * ```
 */
export const FooterTwoColumns: React.FC<FooterTwoColumnsProps> = ({
  company,
  menuItems,
  socialLinks,
  contact,
  copyright,
  iconSize = 24,
  className,
}) => {
  return (
    <Section spacing="xl" className={className}>
      <Row>
        {/* Left Column - Company Info */}
        <Column className="w-[50%]" align="left">
          {/* Company Logo */}
          {company.logo && (
            <Image
              src={company.logo.src}
              alt={company.logo.alt}
              height={company.logo.height || 32}
              width={company.logo.width}
              display="block"
              className="mb-[12px]"
            />
          )}

          {/* Company Name and Tagline */}
          <Text size="md" weight="semibold" className="mb-[8px]">
            {company.name}
          </Text>
          {company.tagline && (
            <Text size="sm" color="secondary" className="mb-[16px]">
              {company.tagline}
            </Text>
          )}

          {/* Contact Information */}
          {contact && (
            <div style={{ marginBottom: '16px' }}>
              {contact.email && (
                <Text size="sm" color="secondary" className="mb-[4px]">
                  <Link variant="default" href={`mailto:${contact.email}`}>
                    {contact.email}
                  </Link>
                </Text>
              )}
              {contact.phone && (
                <Text size="sm" color="secondary" className="mb-[4px]">
                  <Link variant="default" href={`tel:${contact.phone}`}>
                    {contact.phone}
                  </Link>
                </Text>
              )}
              {contact.address && (
                <Text size="sm" color="secondary">
                  {contact.address}
                </Text>
              )}
            </div>
          )}

          {/* Social Links */}
          {socialLinks && socialLinks.length > 0 && (
            <table role="presentation" cellSpacing="0" cellPadding="0" border={0}>
              <tbody>
                <tr>
                  {socialLinks.map((social, index) => (
                    <td key={`${social.platform}-${index}`} style={{ paddingRight: '12px' }}>
                      <Link variant="unstyled" href={social.href}>
                        <Image
                          src={social.icon}
                          alt={`${social.platform} icon`}
                          height={iconSize}
                          width={iconSize}
                          display="inline"
                        />
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}
        </Column>

        {/* Right Column - Navigation Menu */}
        <Column className="w-[50%]" align="right">
          {menuItems && menuItems.length > 0 && (
            <div>
              <Text size="sm" weight="semibold" className="mb-[12px]">
                Quick Links
              </Text>
              {menuItems.map((item, index) => (
                <div key={`${item.label}-${index}`} style={{ marginBottom: '8px' }}>
                  <Link variant="secondary" href={item.href}>
                    {item.label}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Column>
      </Row>

      {/* Copyright - Full Width */}
      {copyright && (
        <>
          <Divider spacing="md" style="light" />
          <Row>
            <Column align="center">
              <Text size="xs" color="muted" align="center">
                {copyright}
              </Text>
            </Column>
          </Row>
        </>
      )}
    </Section>
  );
};
