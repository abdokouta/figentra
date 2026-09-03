import React from 'react';

import { Section, Row, Column, Text, Link, Image } from '@resources/components/base';
import type { GalleryWithHeaderProps } from '@resources/interfaces';

export const GalleryFourImages: React.FC<GalleryWithHeaderProps> = ({
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
      <Section className="mt-[16px]">
        <Row className="mt-[16px]">
          <Column className="w-[50%] pr-[8px]">
            <Link href={items[0]?.href || '#'}>
              <Image
                src={items[0]?.image.src || ''}
                alt={items[0]?.image.alt || ''}
                height={items[0]?.image.height || 288}
                display="block"
                className="w-full rounded-[12px]"
              />
            </Link>
          </Column>
          <Column className="w-[50%] pl-[8px]">
            <Link href={items[1]?.href || '#'}>
              <Image
                src={items[1]?.image.src || ''}
                alt={items[1]?.image.alt || ''}
                height={items[1]?.image.height || 288}
                display="block"
                className="w-full rounded-[12px]"
              />
            </Link>
          </Column>
        </Row>
        <Row className="mt-[16px]">
          <Column className="w-[50%] pr-[8px]">
            <Link href={items[2]?.href || '#'}>
              <Image
                src={items[2]?.image.src || ''}
                alt={items[2]?.image.alt || ''}
                height={items[2]?.image.height || 288}
                display="block"
                className="w-full rounded-[12px]"
              />
            </Link>
          </Column>
          <Column className="w-[50%] pl-[8px]">
            <Link href={items[3]?.href || '#'}>
              <Image
                src={items[3]?.image.src || ''}
                alt={items[3]?.image.alt || ''}
                height={items[3]?.image.height || 288}
                display="block"
                className="w-full rounded-[12px]"
              />
            </Link>
          </Column>
        </Row>
      </Section>
    </Section>
  );
};
