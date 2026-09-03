import React from 'react';
import type { HeaderSocialIconsProps } from '@resources/interfaces';
import { Section, Row, Column, Image, Link } from '@resources/components/base';

/**
 * HeaderSocialIcons component.
 *
 * Creates a header with:
 * - Logo aligned to the left
 * - Social media icons aligned to the right
 * - Clean, modern layout
 *
 * This layout is perfect for newsletters and marketing emails
 * where social media engagement is important.
 *
 * @param props - Component properties
 * @returns Rendered header component
 *
 * @example
 * ```tsx
 * <HeaderSocialIcons
 *   logo={{
 *     src: 'https://example.com/logo.png',
 *     alt: 'Company Logo',
 *     height: 42,
 *   }}
 *   socialLinks={[
 *     {
 *       platform: 'twitter',
 *       url: 'https://twitter.com/company',
 *       icon: 'https://example.com/icons/twitter.png',
 *     },
 *     {
 *       platform: 'facebook',
 *       url: 'https://facebook.com/company',
 *       icon: 'https://example.com/icons/facebook.png',
 *     },
 *   ]}
 * />
 * ```
 */
export const HeaderSocialIcons: React.FC<HeaderSocialIconsProps> = ({
  logo,
  socialLinks,
  iconSize = 24,
  className,
}) => {
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

        {/* Social Icons Column - Aligned Right */}
        <Column align="right">
          <Row>
            {socialLinks.map((social, index) => (
              <Column key={`${social.platform}-${index}`} className="px-[6px]">
                <Link variant="unstyled" href={social.href}>
                  <Image
                    src={social.icon}
                    alt={`${social.platform} icon`}
                    height={iconSize}
                    width={iconSize}
                    display="inline"
                  />
                </Link>
              </Column>
            ))}
          </Row>
        </Column>
      </Row>
    </Section>
  );
};
