import React from 'react';

import { Section, Row, Column, Text } from '@resources/components/base';
import type { StatsSteppedProps } from '@resources/interfaces';

export const StatsStepped: React.FC<StatsSteppedProps> = ({ stats, className }) => {
  return (
    <Section className={className}>
      {stats.map((stat, idx) => (
        <Row key={idx} className="mb-2">
          <Column
            className={`rounded-2xl p-4 ${stat.variant === 'dark' ? 'bg-gray-900' : stat.variant === 'primary' ? 'bg-indigo-700' : 'bg-gray-100'}`}
          >
            <Text
              size="xl"
              weight="bold"
              className={`mb-0 tabular-nums ${stat.variant === 'light' ? 'text-gray-900' : 'text-gray-50'}`}
            >
              {stat.value}
            </Text>
            <div
              className={
                stat.variant === 'light'
                  ? 'text-gray-700'
                  : stat.variant === 'dark'
                    ? 'text-gray-300'
                    : 'text-indigo-100'
              }
            >
              <Text size="md" className="mb-0">
                {stat.label}
              </Text>
              {stat.description && (
                <Text size="sm" className="mb-0 mt-1">
                  {stat.description}
                </Text>
              )}
            </div>
          </Column>
        </Row>
      ))}
    </Section>
  );
};
