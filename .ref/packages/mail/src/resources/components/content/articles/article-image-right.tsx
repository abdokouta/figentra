import React from 'react';

import { Section, Row, Column, Text, Heading, Image, Link } from '@resources/components/base';
import type { ArticleImageRightProps } from '@resources/interfaces';

export const ArticleImageRight: React.FC<ArticleImageRightProps> = ({
  category,
  title,
  description,
  image,
  readMoreUrl,
  className,
}) => {
  return (
    <Section spacing="md" className={className}>
      <table className="w-full">
        <tbody>
          <tr>
            <td className="w-[250px] align-baseline text-left pr-[24px]">
              <Text size="md" weight="semibold" color="primary">
                {category}
              </Text>
              <Text size="lg" weight="semibold" className="mt-[8px]">
                {title}
              </Text>
              <Text size="sm" color="secondary" className="mt-[8px]">
                {description}
              </Text>
              <Link variant="primary" href={readMoreUrl} className="mt-[8px] block">
                Read more →
              </Link>
            </td>
            <td className="w-[220px] align-top">
              <Image
                src={image.src}
                alt={image.alt}
                height={image.height || 220}
                width={image.width || 220}
                display="block"
                className="rounded-[8px]"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
};
