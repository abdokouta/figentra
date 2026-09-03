import React from 'react';

import { Section, Image, Text, Heading, Button } from '@resources/components/base';
import type { ProductSingleProps } from '@resources/interfaces';

export const ProductSingle: React.FC<ProductSingleProps> = ({ product, buttonText, className }) => {
  return (
    <Section spacing="md" className={className}>
      <Image
        src={product.image.src}
        alt={product.image.alt}
        height={product.image.height || 320}
        width="100%"
        display="block"
        className="rounded-[12px]"
      />
      <Section spacing="lg" className="mt-[32px] text-center">
        {product.category && (
          <Text size="md" weight="semibold" color="primary" className="mt-[16px]">
            {product.category}
          </Text>
        )}
        <Heading level="h1" className="mt-[8px]">
          {product.name}
        </Heading>
        <Text size="md" color="secondary" className="mt-[8px]">
          {product.description}
        </Text>
        <Text size="md" weight="semibold">
          {product.price}
        </Text>
        <Button variant="primary" size="md" href={product.url} className="mt-[16px]">
          {buttonText}
        </Button>
      </Section>
    </Section>
  );
};
