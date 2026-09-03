import React from 'react';

import { Section, Row, Column, Heading, Text, Button, Divider } from '@resources/components/base';
import type { FeedbackRatingProps } from '@resources/interfaces';

export const FeedbackRating: React.FC<FeedbackRatingProps> = ({
  question,
  description,
  ratingUrl,
  className,
}) => {
  return (
    <Section spacing="lg" className={className}>
      <Heading level="h1" className="mb-[16px]">
        {question}
      </Heading>
      {description && (
        <Text size="sm" color="secondary" className="mb-[42px]">
          {description}
        </Text>
      )}
      <Section className="max-w-[300px]">
        <Row>
          <Column className="w-[100px] text-center">
            <Text size="xs" color="secondary" className="ml-[12px] text-left leading-none">
              Dissatisfied
            </Text>
          </Column>
          <Column className="w-[100px] text-center">
            <Text size="xs" color="secondary" className="mr-[12px] text-right leading-none">
              Satisfied
            </Text>
          </Column>
        </Row>
      </Section>
      <Section className="mt-[12px] mb-[24px]">
        <Row className="w-full max-w-[300px] table-fixed border-separate">
          {Array.from({ length: 5 }).map((_, i) => (
            <Column key={i} className="rounded-[6px] bg-indigo-600">
              <Button
                href={`${ratingUrl}?rating=${i + 1}`}
                variant="primary"
                size="md"
                fullWidth
                className="m-0"
              >
                {i + 1}
              </Button>
            </Column>
          ))}
        </Row>
      </Section>
      <Divider />
    </Section>
  );
};
