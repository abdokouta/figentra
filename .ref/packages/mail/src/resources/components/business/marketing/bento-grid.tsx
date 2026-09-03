import React from 'react';

import { Section, Row, Column, Heading, Text, Link, Image } from '@resources/components/base';
import type { BentoGridProps } from '@resources/interfaces';

export const BentoGrid: React.FC<BentoGridProps> = ({ hero, products, className }) => {
  return (
    <Section className={`rounded-[8px] overflow-hidden p-0 ${className || ''}`}>
      <Section>
        <Row
          className={`${hero.backgroundColor || 'bg-[rgb(41,37,36)]'} border-separate m-0 table-fixed w-full`}
        >
          <Column className="pl-[12px]">
            <Heading level="h1" className="text-white text-[28px] mb-[10px]">
              {hero.title}
            </Heading>
            <Text className="text-white/60 text-[14px] m-0">{hero.description}</Text>
            <Link
              href={hero.linkUrl}
              className="text-white/80 block text-[14px] font-semibold mt-[12px] no-underline"
            >
              {hero.linkText} →
            </Link>
          </Column>
          <Column className="w-[42%] h-[250px]">
            <Image
              src={hero.image.src}
              alt={hero.image.alt}
              className="rounded-[4px] h-full -mr-[6px] object-cover object-center w-full"
            />
          </Column>
        </Row>
      </Section>
      <Section className="mb-[24px]">
        <Row className="border-separate table-fixed w-full">
          {products.map((product, idx) => (
            <Column key={idx} className="mx-auto max-w-[180px]">
              <Image
                src={product.image.src}
                alt={product.image.alt}
                className="rounded-[4px] mb-[18px] w-full"
              />
              <div>
                <Heading level="h2" className="text-[14px] font-bold mb-[8px]">
                  {product.title}
                </Heading>
                <Text size="xs" color="secondary" className="m-0 pr-[12px]">
                  {product.description}
                </Text>
              </div>
            </Column>
          ))}
        </Row>
      </Section>
    </Section>
  );
};
