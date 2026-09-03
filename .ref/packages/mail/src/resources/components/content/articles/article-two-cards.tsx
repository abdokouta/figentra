import React from 'react';

import { Section, Row, Column, Text, Heading, Image } from '@resources/components/base';
import type { ArticleTwoCardsProps } from '@resources/interfaces';

export const ArticleTwoCards: React.FC<ArticleTwoCardsProps> = ({
  heading,
  subheading,
  cards,
  className,
}) => {
  return (
    <Section spacing="md" className={className}>
      <Row>
        <Text size="lg" weight="semibold">
          {heading}
        </Text>
        <Text size="md" color="secondary" className="mt-[8px]">
          {subheading}
        </Text>
      </Row>
      <Row className="mt-[16px]">
        {cards.map((card, index) => (
          <Column
            key={index}
            className={`w-1/2 ${index === 0 ? 'pr-[8px]' : 'pl-[8px]'} align-baseline`}
          >
            <Image
              src={card.image.src}
              alt={card.image.alt}
              height={card.image.height || 180}
              width="100%"
              display="block"
              className="rounded-[8px]"
            />
            <Text size="md" weight="semibold" color="primary" className="mt-[8px]">
              {card.category}
            </Text>
            <Text size="lg" weight="semibold" className="mt-[4px]">
              {card.title}
            </Text>
            <Text size="sm" color="secondary" className="mt-[8px]">
              {card.description}
            </Text>
          </Column>
        ))}
      </Row>
    </Section>
  );
};
