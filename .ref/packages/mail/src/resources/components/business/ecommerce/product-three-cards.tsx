import React from 'react';

import { Section, Row, Column, Text, Image, Button } from '@resources/components/base';
import type { ProductGridProps } from '@resources/interfaces';

export const ProductThreeCards: React.FC<ProductGridProps> = ({
  heading,
  description,
  products,
  buttonText,
  className,
}) => {
  return (
    <Section spacing="md" className={className}>
      <Row>
        <Text size="lg" weight="semibold">
          {heading}
        </Text>
        <Text size="md" color="secondary" className="mt-[8px]">
          {description}
        </Text>
      </Row>
      <Row className="mt-[16px]">
        {products.slice(0, 3).map((product, idx) => (
          <Column
            key={idx}
            className={`py-[16px] text-left ${idx === 0 ? 'pr-[4px]' : idx === 1 ? 'px-[4px]' : 'pl-[4px]'}`}
          >
            <Image
              src={product.image.src}
              alt={product.image.alt}
              height={product.image.height || 180}
              width="100%"
              display="block"
              className="rounded-[8px]"
            />
            <Text size="lg" weight="semibold" className="m-0 mt-[24px]">
              {product.name}
            </Text>
            <Text size="md" color="secondary" className="m-0 mt-[16px]">
              {product.description}
            </Text>
            <Text size="md" weight="semibold" className="m-0 mt-[8px]">
              {product.price}
            </Text>
            <Button variant="primary" size="md" href={product.url} className="mt-[16px]">
              {buttonText}
            </Button>
          </Column>
        ))}
      </Row>
    </Section>
  );
};
