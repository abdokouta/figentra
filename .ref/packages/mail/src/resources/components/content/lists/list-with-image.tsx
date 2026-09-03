import React from 'react';

import { Section, Row, Column, Heading, Text, Image, Link } from '@resources/components/base';
import type { ListWithImageProps } from '@resources/interfaces';

export const ListWithImage: React.FC<ListWithImageProps> = ({ heading, items, className }) => {
  return (
    <Section spacing="lg" className={className}>
      <Heading level="h1" className="mb-[42px] text-center">
        {heading}
      </Heading>
      {items.map((item, idx) => (
        <Section key={idx} className="mb-[30px]">
          <Row className="mb-[24px]">
            <Column className="w-2/5 pr-[24px]">
              <Image
                src={item.image.src}
                alt={item.image.alt}
                height={168}
                width="100%"
                display="block"
                className="rounded-[4px]"
              />
            </Column>
            <Column className="w-3/5 pr-[24px]">
              <div className="mb-[18px] flex h-[24px] w-[24px] items-center justify-center rounded-full bg-indigo-600 font-semibold text-white text-[12px] leading-none">
                {item.number}
              </div>
              <Heading level="h2" className="mt-0 mb-[8px]">
                {item.title}
              </Heading>
              <Text size="sm" color="secondary" className="m-0">
                {item.description}
              </Text>
              {item.learnMoreUrl && (
                <Link variant="primary" href={item.learnMoreUrl} className="mt-[12px] block">
                  Learn more →
                </Link>
              )}
            </Column>
          </Row>
        </Section>
      ))}
    </Section>
  );
};
