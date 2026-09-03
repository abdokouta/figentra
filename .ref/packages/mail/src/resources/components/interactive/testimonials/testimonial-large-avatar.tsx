import React from 'react';

import { Row, Column, Image, Text } from '@resources/components/base';
import type { TestimonialLargeAvatarProps } from '@resources/interfaces';

export const TestimonialLargeAvatar: React.FC<TestimonialLargeAvatarProps> = ({
  quote,
  author,
  avatarSize = 320,
  className,
}) => {
  return (
    <Row className={`mx-[12px] my-[16px] ${className || ''}`}>
      <Column className="mt-0 mr-[24px] mb-[24px] ml-0 w-64 overflow-hidden rounded-3xl">
        <Image
          src={author.avatar || ''}
          alt={author.name}
          height={avatarSize}
          width={avatarSize}
          display="block"
          className="w-full"
        />
      </Column>
      <Column className="pr-[24px]">
        <Text size="md" className="mx-0 my-0 mb-[24px] font-light">
          {quote}
        </Text>
        <Text size="md" weight="semibold" className="mx-0 mt-0 mb-[4px]">
          {author.name}
        </Text>
        <Text size="sm" color="secondary" className="m-0">
          {author.title}
        </Text>
      </Column>
    </Row>
  );
};
