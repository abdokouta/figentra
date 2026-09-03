import React from 'react';

import { Section, Row, Column, Text, Image, Divider } from '@resources/components/base';
import type { FeaturesWithHeaderProps, FeatureItem } from '@resources/interfaces';

export const FeaturesList: React.FC<FeaturesWithHeaderProps> = ({
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
      <Section>
        <Divider spacing="lg" />
        {(features as FeatureItem[]).map((feature, idx) => (
          <React.Fragment key={idx}>
            <Section>
              <Row>
                <Column className="align-baseline">
                  <Image src={feature.icon.src} alt={feature.icon.alt} height={48} width={48} />
                </Column>
                <Column className="w-[85%]">
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
    </Section>
  );
};
