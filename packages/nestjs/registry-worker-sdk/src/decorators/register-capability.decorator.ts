/**
 * @file register-capability.decorator.ts
 * @description Annotates a Nest class as advertising a capability in the application manifest.
 *
 * Capabilities are opaque feature-contract keys that other applications can query
 * to discover cross-application dependencies. Example: `"multi-tenancy"`, `"sso"`.
 *
 * @example
 * ```ts
 * \@RegisterCapability({ key: 'multi-tenancy' })
 * \@Injectable()
 * export class TenantService {}
 * ```
 */

import type { CapabilityManifest } from "../interfaces/registry-manifest.interface";
import { appendRegistryRecord } from "../utils/metadata.util";

/**
 * Declares an advertised capability in the application manifest.
 * @param value - Capability descriptor.
 */
export function RegisterCapability(value: CapabilityManifest): ClassDecorator {
  return (target) => appendRegistryRecord(target, "capability", value);
}

/** @deprecated Use {@link RegisterCapability} instead. */
export const RegistryCapability = RegisterCapability;
