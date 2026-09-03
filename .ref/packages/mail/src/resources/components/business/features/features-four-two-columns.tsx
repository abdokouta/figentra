import React from 'react';

import { Section, Row, Text, Image } from '@resources/components/base';
import type { FeaturesWithHeaderProps, FeatureItem } from '@resources/interfaces';

export const FeaturesFourTwoColumns: React.FC<FeaturesWithHeaderProps> = ({
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
      <table width="100%" className="mt-[16px]">
        <tbody>
          <tr>
            {(features as FeatureItem[]).slice(0, 2).map((feature, idx) => (
              <td
                key={idx}
                align="center"
                className={`w-1/2 ${idx === 0 ? 'pr-[12px]' : 'pr-[12px]'} align-baseline`}
              >
                <Image src={feature.icon.src} alt={feature.icon.alt} height={48} width={48} />
                <Text size="lg" weight="semibold" className="mt-[16px]">
                  {feature.title}
                </Text>
                <Text size="sm" color="secondary" className="mt-[8px]">
                  {feature.description}
                </Text>
              </td>
            ))}
          </tr>
          <tr className="mt-[16px]">
            {(features as FeatureItem[]).slice(2, 4).map((feature, idx) => (
              <td
                key={idx}
                align="center"
                className={`w-1/2 ${idx === 0 ? 'pr-[12px]' : 'pr-[12px]'} align-baseline`}
              >
                <Image src={feature.icon.src} alt={feature.icon.alt} height={48} width={48} />
                <Text size="lg" weight="semibold" className="mt-[16px]">
                  {feature.title}
                </Text>
                <Text size="sm" color="secondary" className="mt-[8px]">
                  {feature.description}
                </Text>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </Section>
  );
};
