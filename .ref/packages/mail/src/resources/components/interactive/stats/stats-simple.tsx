import React from 'react';

import { Row, Column, Text } from '@resources/components/base';
import type { StatsSimpleProps } from '@resources/interfaces';

export const StatsSimple: React.FC<StatsSimpleProps> = ({ stats, className }) => {
  return (
    <Row className={className}>
      {stats.map((stat, idx) => (
        <Column key={idx}>
          <Text size="lg" weight="bold" className="m-0 tabular-nums">
            {stat.value}
          </Text>
          <Text size="xs" color="secondary" className="m-0">
            {stat.label}
          </Text>
        </Column>
      ))}
    </Row>
  );
};
