import React from 'react';

import { Section, Row, Column, Image, Text } from '@resources/components/base';
import type { TestimonialSimpleProps } from '@resources/interfaces';

export const TestimonialSimple: React.FC<TestimonialSimpleProps> = ({
  quote,
  author,
  className,
}) => {
  return (
    <Section className={`text-center ${className || ''}`}>
      <Text size="md" className="m-0 font-light">
        {quote}
      </Text>
      <Row className="mt-8">
        <Column align="center" className="h-[32px] w-[32px] rounded-full overflow-hidden">
          <Image
            src={author.avatar || ''}
            alt={author.name}
            height={32}
            width={32}
            display="block"
            className="h-[32px] w-[32px]"
          />
        </Column>
        <Column align="center">
          <Text size="sm" weight="semibold" className="m-0 ml-[12px] mr-[8px]">
            {author.name}
          </Text>
        </Column>
        <Column align="center">
          <span className="text-[14px] mr-[8px]">•</span>
        </Column>
        <Column align="center">
          <Text size="sm" className="m-0">
            {author.title}
          </Text>
        </Column>
      </Row>
    </Section>
  );
};
