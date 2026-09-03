import React from 'react';

import { Section, Heading, Text } from '@resources/components/base';
import type { ListSimpleProps } from '@resources/interfaces';

export const ListSimple: React.FC<ListSimpleProps> = ({ heading, items, className }) => {
  return (
    <Section spacing="lg" className={className}>
      <Heading level="h1" className="mb-[42px] text-center">
        {heading}
      </Heading>
      {items.map((item, idx) => (
        <Section key={idx} className="mb-[36px]">
          <div className="mr-[32px] ml-[12px] inline-flex items-start">
            <div className="mr-[18px] flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-indigo-600 font-semibold text-white text-[12px] leading-none">
              {item.number}
            </div>
            <div>
              <Heading level="h2" className="mt-0 mb-[8px]">
                {item.title}
              </Heading>
              <Text size="sm" color="secondary" className="m-0">
                {item.description}
              </Text>
            </div>
          </div>
        </Section>
      ))}
    </Section>
  );
};
