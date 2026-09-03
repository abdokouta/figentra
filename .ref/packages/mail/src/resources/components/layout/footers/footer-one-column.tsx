import React from 'react';

import { Section, Row, Column, Image, Text, Link, Divider } from '@resources/components/base';
import type { FooterOneColumnProps } from '@resources/interfaces';

/**
 * FooterOneColumn component.
 *
 * Creates a single-column footer with:
 * - Company logo and name (centered)
 * - Optional tagline
 * - Optional horizontal menu links
 * - Optional social media icons (centered)
 * - Optional contact information
 * - Copyright text at the bottom
 *
 * This layout works best for clean, minimalist email footers
 * with limited content.
 *
 * @param props - Component properties
 * @returns Rendered footer component
 *
 * @example
 * ```tsx
 * <FooterOneColumn
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
 *     { label: 'Privacy', href: '/privacy' },
 *     { label: 'Terms', href: '/terms' },
 *     { label: 'Contact', href: '/contact' },
 *   ]}
 *   socialLinks={[
 *     {
 *       platform: 'twitter',
 *       url: 'https://twitter.com/acme',
 *       icon: 'https://example.com/icons/twitter.png',
 *     },
 *   ]}
 *   copyright="© 2024 Acme Inc. All rights reserved."
 * />
 * ```
 */
export const FooterOneColumn: React.FC<FooterOneColumnProps> = ({
  company,
  menuItems,
  socialLinks,
  contact,
  copyright,
  className,
}) => {
  return (
    <Section spacing="xl" className={className}>
      {/* Company Logo and Name */}
      {company.logo && (
        <Row>
          <Column align="center">
            <Image
              src={company.logo.src}
              alt={company.logo.alt}
              height={company.logo.height || 32}
              width={company.logo.width}
              display="block"
            />
          </Column>
        </Row>
      )}

      {/* Company Name and Tagline */}
      <Row>
        <Column align="center">
          <Text size="md" weight="semibold" align="center" className="mb-[8px]">
            {company.name}
          </Text>
          {company.tagline && (
            <Text size="sm" color="secondary" align="center">
              {company.tagline}
            </Text>
          )}
        </Column>
      </Row>

      {/* Menu Items - Horizontal Layout */}
      {menuItems && menuItems.length > 0 && (
        <>
          <Divider spacing="md" style="light" />
          <Row>
            <Column align="center">
              <table role="presentation" cellSpacing="0" cellPadding="0" border={0}>
                <tbody>
                  <tr>
                    {menuItems.map((item, index) => (
                      <td key={`${item.label}-${index}`} style={{ padding: '0 12px' }}>
                        <Link variant="secondary" href={item.href}>
                          {item.label}
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </Column>
          </Row>
        </>
      )}

      {/* Social Links */}
      {socialLinks && socialLinks.length > 0 && (
        <>
          <Divider spacing="md" style="light" />
          <Row>
            <Column align="center">
              <table role="presentation" cellSpacing="0" cellPadding="0" border={0}>
                <tbody>
                  <tr>
                    {socialLinks.map((social, index) => (
                      <td key={`${social.platform}-${index}`} style={{ padding: '0 8px' }}>
                        <Link variant="unstyled" href={social.href}>
                          <Image
                            src={social.icon}
                            alt={`${social.platform} icon`}
                            height={24}
                            width={24}
                            display="inline"
                          />
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </Column>
          </Row>
        </>
      )}

      {/* Contact Information */}
      {contact && (
        <>
          <Divider spacing="md" style="light" />
          <Row>
            <Column align="center">
              {contact.email && (
                <Text size="sm" color="secondary" align="center">
                  Email:{' '}
                  <Link variant="default" href={`mailto:${contact.email}`}>
                    {contact.email}
                  </Link>
                </Text>
              )}
              {contact.phone && (
                <Text size="sm" color="secondary" align="center">
                  Phone:{' '}
                  <Link variant="default" href={`tel:${contact.phone}`}>
                    {contact.phone}
                  </Link>
                </Text>
              )}
              {contact.address && (
                <Text size="sm" color="secondary" align="center">
                  {contact.address}
                </Text>
              )}
            </Column>
          </Row>
        </>
      )}

      {/* Copyright */}
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
