import React from 'react';

import { Section, Row, Column, Text, Divider } from '@resources/components/base';
import type { FeaturesWithHeaderProps, NumberedFeatureItem } from '@resources/interfaces';

export const FeaturesNumbered: React.FC<FeaturesWithHeaderProps> = ({
  heading,
  description,
  features,
  className,
}) => {
  return (
    <Section spacing="md" className={className}>
      <Row>
        <Text size="xl" weight="semibold">
          {heading}
        </Text>
        <Text size="md" color="secondary" className="mt-[8px]">
          {description}
        </Text>
      </Row>
      <Divider spacing="lg" />
      {(features as NumberedFeatureItem[]).map((feature, idx) => (
        <React.Fragment key={idx}>
          <Section>
            <Row>
              <Column className="align-baseline">
                <table className="text-center">
                  <tbody>
                    <tr>
                      <td
                        align="center"
                        className="h-[40px] w-[40px] rounded-full bg-indigo-200 p-0"
                      >
                        <Text size="md" weight="semibold" color="primary" className="m-0">
                          {feature.number}
                        </Text>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Column>
              <Column className="w-[90%]">
                <Text size="lg" weight="semibold">
                  {feature.title}
                </Text>
                <Text size="md" color="secondary" className="mt-[8px]">
                  {feature.description}
                </Text>
              </Column>
            </Row>
          </Section>
          <Divider spacing="lg" />
        </React.Fragment>
      ))}
    </Section>
  );
};
