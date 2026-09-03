import React from 'react';

import { Section, Row, Column, Heading, Text, Button, Divider } from '@resources/components/base';
import type { PricingTwoTiersProps } from '@resources/interfaces';

export const PricingTwoTiers: React.FC<PricingTwoTiersProps> = ({
  heading,
  description,
  plans,
  className,
}) => {
  return (
    <Section className={className}>
      <Section className="mb-[42px]">
        <Heading level="h1" className="text-center mb-[12px]">
          {heading}
        </Heading>
        <Text size="sm" color="secondary" className="mx-auto max-w-[500px] text-center">
          {description}
        </Text>
      </Section>
      <Row className="gap-[20px] pb-[24px]">
        {plans.map((plan, idx) => (
          <Column
            key={idx}
            className={`w-1/2 rounded-[8px] border border-solid p-[24px] ${plan.highlighted ? 'bg-[rgb(16,24,40)] border-[rgb(16,24,40)] text-gray-300 mb-[12px]' : 'bg-white border-gray-300 text-gray-600 mb-[24px]'}`}
          >
            <Text
              size="sm"
              weight="semibold"
              className={`mb-[16px] ${plan.highlighted ? 'text-[rgb(124,134,255)]' : 'text-[rgb(79,70,229)]'}`}
            >
              {plan.title}
            </Text>
            <Text size="xl" weight="bold" className="mb-[8px] mt-0">
              <span className={plan.highlighted ? 'text-white' : 'text-[rgb(16,24,40)]'}>
                ${plan.price}
              </span>{' '}
              <span className="text-[14px] leading-[20px]">/ month</span>
            </Text>
            <Text className="mt-[12px] mb-[24px]">{plan.description}</Text>
            <ul className="text-[12px] leading-[20px] mb-[30px] pl-[14px]">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="mb-[8px]">
                  {feature}
                </li>
              ))}
            </ul>
            <Button variant="primary" size="md" href={plan.buttonUrl} fullWidth>
              {plan.buttonText}
            </Button>
          </Column>
        ))}
      </Row>
      <Divider className="mt-0" />
    </Section>
  );
};
