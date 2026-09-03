import React from 'react';

import { Section, Text, Button, Divider } from '@resources/components/base';
import type { PricingSimpleProps } from '@resources/interfaces';

export const PricingSimple: React.FC<PricingSimpleProps> = ({ plan, footerNote, className }) => {
  return (
    <Section
      className={`border border-solid border-gray-300 rounded-[12px] p-[28px] ${className || ''}`}
    >
      <Text
        size="xs"
        weight="semibold"
        color="primary"
        className="uppercase tracking-wide mb-[16px] mt-[16px]"
      >
        {plan.title}
      </Text>
      <Text size="xl" weight="bold" className="mb-[12px] mt-0">
        <span>${plan.price}</span>{' '}
        <span className="text-[16px] font-medium leading-[20px]">/ month</span>
      </Text>
      <Text size="sm" className="mt-[16px] mb-[24px]">
        {plan.description}
      </Text>
      <ul className="text-gray-500 text-[14px] leading-[24px] mb-[32px] pl-[14px]">
        {plan.features.map((feature, idx) => (
          <li key={idx} className="mb-[12px] relative">
            <span className="relative">{feature}</span>
          </li>
        ))}
      </ul>
      <Button variant="primary" size="md" href={plan.buttonUrl} fullWidth className="mb-[24px]">
        {plan.buttonText}
      </Button>
      {footerNote && (
        <>
          <Divider />
          <Text size="xs" color="muted" className="italic mt-[24px] mb-[6px] text-center">
            {footerNote}
          </Text>
        </>
      )}
    </Section>
  );
};
