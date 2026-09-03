import React from 'react';

import { Section, Row, Column, Text, Link, Image } from '@resources/components/base';
import type { GalleryWithHeaderProps } from '@resources/interfaces';

export const GalleryThreeColumns: React.FC<GalleryWithHeaderProps> = ({
  category,
  title,
  description,
  items,
  className,
}) => {
  return (
    <Section spacing="md" className={className}>
      <Row>
        <Text size="md" weight="semibold" color="primary">
          {category}
        </Text>
        <Text size="xl" weight="semibold" className="mt-[8px]">
          {title}
        </Text>
        <Text size="md" color="secondary" className="mt-[8px]">
          {description}
        </Text>
      </Row>
      <Row>
        {items.slice(0, 3).map((item, idx) => (
          <Column
            key={idx}
            className={`w-1/3 ${idx === 0 ? 'pr-[8px]' : idx === 1 ? 'px-[8px]' : 'pl-[8px]'}`}
          >
            <Link href={item.href || '#'}>
              <Image
                src={item.image.src}
                alt={item.image.alt}
                height={item.image.height || 186}
                display="block"
                className="w-full rounded-[12px]"
              />
            </Link>
          </Column>
        ))}
      </Row>
    </Section>
  );
};
