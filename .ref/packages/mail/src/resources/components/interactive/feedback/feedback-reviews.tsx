import React from 'react';

import { Section, Heading, Text, Button, Divider } from '@resources/components/base';
import type { FeedbackReviewsProps } from '@resources/interfaces';

export const FeedbackReviews: React.FC<FeedbackReviewsProps> = ({
  overallRating,
  ratings,
  totalReviews,
  ctaText,
  ctaUrl,
  className,
}) => {
  return (
    <Section spacing="lg" className={className}>
      <Heading level="h1">Customer Reviews</Heading>
      <Text className="hidden">{overallRating}</Text>
      <Section className="my-[24px]">
        {ratings.map((rating) => (
          <div key={rating.rating} className="flex items-center text-[14px] leading-[20px]">
            <div className="flex flex-1 items-center">
              <Text size="xs" weight="medium" color="secondary" className="w-[12px]">
                {rating.rating}
              </Text>
              <div className="relative ml-[12px] flex-1">
                <div className="h-[12px] rounded-[6px] border border-gray-200 bg-gray-100" />
                {rating.count > 0 && (
                  <div
                    className="absolute top-0 bottom-0 rounded-[6px] bg-indigo-600"
                    style={{ width: `calc(${rating.count} / ${totalReviews} * 100%)` }}
                  />
                )}
              </div>
            </div>
            <Text
              size="xs"
              weight="medium"
              color="secondary"
              className="ml-[12px] text-right tabular-nums"
            >
              {Math.round((rating.count / totalReviews) * 100)}%
            </Text>
          </div>
        ))}
        <Text size="xs" color="secondary" className="mt-[14px] text-center">
          Based on <span className="font-semibold">{totalReviews}</span> Reviews
        </Text>
      </Section>
      <Divider />
      <Section className="mt-[30px]">
        <Heading level="h3" className="mb-[12px]">
          Share your thoughts
        </Heading>
        <Text size="sm" color="secondary" className="m-0">
          If you've used this product, share your thoughts with other customers
        </Text>
        <Button variant="primary" size="md" href={ctaUrl} fullWidth className="mt-[26px] mb-[24px]">
          {ctaText}
        </Button>
      </Section>
    </Section>
  );
};
