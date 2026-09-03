import React from 'react';

import { Section, Image, Text, Heading, Button } from '@resources/components/base';
import type { ArticleWithImageProps } from '@resources/interfaces';

export const ArticleWithImage: React.FC<ArticleWithImageProps> = ({
  image,
  category,
  title,
  description,
  buttonText,
  buttonUrl,
  className,
}) => {
  return (
    <Section spacing="md" className={className}>
      <Image
        src={image.src}
        alt={image.alt}
        height={image.height || 320}
        width={image.width}
        display="block"
        className="rounded-[12px]"
      />
      <Section spacing="lg" className="text-center">
        <Text size="md" weight="semibold" color="primary" className="mt-[16px]">
          {category}
        </Text>
        <Heading level="h1" className="mt-[8px]">
          {title}
        </Heading>
        <Text size="md" color="secondary">
          {description}
        </Text>
        <Button variant="primary" size="md" href={buttonUrl} className="mt-[16px]">
          {buttonText}
        </Button>
      </Section>
    </Section>
  );
};
