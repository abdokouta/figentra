/**
 * @file register-feature.decorator.ts
 * @description Annotates a Nest class as a feature flag declaration in the application manifest.
 *
 * Feature flag declarations expose toggle metadata so the platform can manage rollouts.
 * The registry stores the default state; live toggle values are managed by the feature
 * flag service at runtime.
 *
 * @example
 * ```ts
 * \@RegisterFeature({ key: 'new-billing-ui', defaultEnabled: false })
 * \@Injectable()
 * export class BillingFeatureToggle {}
 * ```
 */

import type { FeatureManifest } from "../interfaces/registry-manifest.interface";
import { appendRegistryRecord } from "../utils/metadata.util";

/**
 * Declares a feature flag in the application manifest.
 * @param value - Feature flag descriptor.
 */
export function RegisterFeature(value: FeatureManifest): ClassDecorator {
  return (target) => appendRegistryRecord(target, "feature", value);
}

/** @deprecated Use {@link RegisterFeature} instead. */
export const RegistryFeature = RegisterFeature;
