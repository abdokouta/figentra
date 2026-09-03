import React from 'react';

import { Text, Heading, Button } from '@resources/components/base';
import type { ArticleImageBackgroundProps } from '@resources/interfaces';

export const ArticleImageBackground: React.FC<ArticleImageBackgroundProps> = ({
  backgroundImage,
  category,
  title,
  description,
  buttonText,
  buttonUrl,
  className,
}) => {
  return (
    <table
      align="center"
      border={0}
      cellPadding="0"
      cellSpacing="0"
      className={`my-[16px] h-[424px] rounded-[12px] ${className || ''}`}
      role="presentation"
      style={{ backgroundImage: `url('${backgroundImage}')`, backgroundSize: '100% 100%' }}
      width="100%"
    >
      <tbody>
        <tr>
          <td align="center" className="p-[40px] text-center">
            <Text size="md" weight="semibold" className="text-gray-200">
              {category}
            </Text>
            <Heading level="h1" className="mt-[4px] text-white">
              {title}
            </Heading>
            <Text size="md" className="mt-[8px] text-white">
              {description}
            </Text>
            <Button variant="outline" size="md" href={buttonUrl} className="mt-[24px]">
              {buttonText}
            </Button>
          </td>
        </tr>
      </tbody>
    </table>
  );
};
