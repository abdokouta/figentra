import React from 'react';

import { Section, Text, Heading, Row, Column, Button } from '@resources/components/base';
import type { FeedbackSurveyProps } from '@resources/interfaces';

export const FeedbackSurvey: React.FC<FeedbackSurveyProps> = ({
  category,
  heading,
  description,
  ratingUrl,
  className,
}) => {
  return (
    <Section spacing="md" className={`text-center ${className || ''}`}>
      <Text size="md" weight="semibold" color="primary" className="my-[8px]">
        {category}
      </Text>
      <Heading level="h1" className="m-0 mt-[8px]">
        {heading}
      </Heading>
      <Text size="md" className="mt-[8px]">
        {description}
      </Text>
      <Row className="mt-[16px]">
        <Column align="center">
          <table role="presentation" cellSpacing="0" cellPadding="0">
            <tbody>
              <tr>
                {[1, 2, 3, 4, 5].map((number) => (
                  <td align="center" className="p-[4px]" key={number}>
                    <Button
                      href={`${ratingUrl}?rating=${number}`}
                      variant="outline"
                      className="h-[20px] w-[20px] p-[8px]"
                    >
                      {number}
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </Column>
      </Row>
    </Section>
  );
};
