import React from 'react';

import { Row, Section, Image, Heading, Text, Link, Divider } from '@resources/components/base';
import type { ArticleMultipleAuthorsProps } from '@resources/interfaces';

export const ArticleMultipleAuthors: React.FC<ArticleMultipleAuthorsProps> = ({
  authors,
  className,
}) => {
  return (
    <Row className={className}>
      <Divider spacing="sm" />
      <Section>
        {authors.map((author, index) => (
          <React.Fragment key={index}>
            <Section spacing="sm" className="mt-[16px] max-w-[288px]">
              <Section className="inline-block max-h-[48px] max-w-[48px] mt-[5px]">
                <Image
                  src={author.avatar || ''}
                  alt={author.name}
                  height={48}
                  width={48}
                  display="block"
                  className="rounded-full"
                />
              </Section>
              <Section className="ml-[18px] inline-block max-w-[120px] align-top">
                <Heading level="h3" className="m-0 text-[14px]">
                  {author.name}
                </Heading>
                <Text size="xs" color="secondary" className="m-0">
                  {author.title}
                </Text>
                {author.socialLinks && author.socialLinks.length > 0 && (
                  <Section className="mt-[4px]">
                    {author.socialLinks.map((social: any, idx: number) => (
                      <Link
                        key={idx}
                        variant="unstyled"
                        href={social.href}
                        className={idx > 0 ? 'ml-[8px]' : ''}
                      >
                        <Image
                          src={social.icon}
                          alt={social.platform}
                          height={12}
                          width={12}
                          display="inline"
                        />
                      </Link>
                    ))}
                  </Section>
                )}
              </Section>
            </Section>
            {index < authors.length - 1 && (
              <div
                className="mr-[16px] inline-block h-[58px] w-[1px] bg-gray-300"
                style={{ float: 'left', border: 'none' }}
              />
            )}
          </React.Fragment>
        ))}
      </Section>
    </Row>
  );
};
