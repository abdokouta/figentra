import React from 'react';

import { Section, Image, Text, Button } from '@resources/components/base';
import type { ProductImageLeftProps } from '@resources/interfaces';

export const ProductImageLeft: React.FC<ProductImageLeftProps> = ({
  product,
  buttonText,
  className,
}) => {
  return (
    <Section spacing="md" className={className}>
      <table className="w-full">
        <tbody>
          <tr>
            <td className="box-border w-1/2 pr-[32px]">
              <Image
                src={product.image.src}
                alt={product.image.alt}
                height={product.image.height || 220}
                width="100%"
                display="block"
                className="rounded-[8px]"
              />
            </td>
            <td className="w-1/2 align-baseline">
              <Text size="lg" weight="semibold" className="m-0 mt-[8px]">
                {product.name}
              </Text>
              <Text size="md" color="secondary" className="mt-[8px]">
                {product.description}
              </Text>
              <Text size="md" weight="semibold" className="mt-[8px]">
                {product.price}
              </Text>
              <Button variant="primary" size="md" href={product.url} className="w-3/4">
                {buttonText}
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
};
