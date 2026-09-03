import React from 'react';

import { Section, Heading, Image, Text, Button } from '@resources/components/base';
import type { ProductCheckoutProps } from '@resources/interfaces';

export const ProductCheckout: React.FC<ProductCheckoutProps> = ({
  heading,
  items,
  buttonText,
  checkoutUrl,
  className,
}) => {
  return (
    <Section spacing="md" className={`text-center ${className || ''}`}>
      <Heading level="h1" className="mb-0">
        {heading}
      </Heading>
      <Section className="my-[16px] rounded-[8px] border border-gray-200 border-solid p-[16px] pt-0">
        <table className="mb-[16px]" width="100%">
          <thead>
            <tr>
              <th className="border-0 border-gray-200 border-b border-solid py-[8px]">&nbsp;</th>
              <th
                align="left"
                className="border-0 border-gray-200 border-b border-solid py-[8px] text-gray-500"
                colSpan={6}
              >
                <Text weight="semibold">Product</Text>
              </th>
              <th
                align="center"
                className="border-0 border-gray-200 border-b border-solid py-[8px] text-gray-500"
              >
                <Text weight="semibold">Quantity</Text>
              </th>
              <th
                align="center"
                className="border-0 border-gray-200 border-b border-solid py-[8px] text-gray-500"
              >
                <Text weight="semibold">Price</Text>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td className="border-0 border-gray-200 border-b border-solid py-[8px]">
                  <Image
                    src={item.image.src}
                    alt={item.image.alt}
                    height={110}
                    className="rounded-[8px]"
                  />
                </td>
                <td
                  align="left"
                  className="border-0 border-gray-200 border-b border-solid py-[8px]"
                  colSpan={6}
                >
                  <Text>{item.name}</Text>
                </td>
                <td
                  align="center"
                  className="border-0 border-gray-200 border-b border-solid py-[8px]"
                >
                  <Text>{item.quantity}</Text>
                </td>
                <td
                  align="center"
                  className="border-0 border-gray-200 border-b border-solid py-[8px]"
                >
                  <Text>{item.price}</Text>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Button variant="primary" size="md" href={checkoutUrl} fullWidth className="mt-[16px]">
          {buttonText}
        </Button>
      </Section>
    </Section>
  );
};
