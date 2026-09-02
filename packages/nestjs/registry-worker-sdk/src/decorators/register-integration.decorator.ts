/**
 * @file register-integration.decorator.ts
 * @description Annotates a Nest class as a third-party integration in the application manifest.
 *
 * Integrations advertise external vendor dependencies (Stripe, Twilio, etc.)
 * so that the platform catalog can surface them for discovery and governance.
 *
 * @example
 * ```ts
 * \@RegisterIntegration({ key: 'stripe', provider: 'stripe', kind: 'payment' })
 * \@Injectable()
 * export class StripeService {}
 * ```
 */

import type { IntegrationManifest } from "../interfaces/registry-manifest.interface";
import { appendRegistryRecord } from "../utils/metadata.util";

/**
 * Declares a third-party integration in the application manifest.
 * @param value - Integration descriptor.
 */
export function RegisterIntegration(value: IntegrationManifest): ClassDecorator {
  return (target) => appendRegistryRecord(target, "integration", value);
}

/** @deprecated Use {@link RegisterIntegration} instead. */
export const RegistryIntegration = RegisterIntegration;
