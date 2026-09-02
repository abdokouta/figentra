/**
 * @file register-module.decorator.ts
 * @description Annotates a Nest class as a logical module in the application manifest.
 *
 * @example
 * ```ts
 * \@RegisterModule({ key: 'audit', description: 'Audit log management' })
 * \@Injectable()
 * export class AuditService {}
 * ```
 */

import type { ModuleManifest } from "../interfaces/registry-manifest.interface";
import { appendRegistryRecord } from "../utils/metadata.util";

/**
 * Declares a logical module boundary in the application manifest.
 * @param value - Module descriptor.
 */
export function RegisterModule(value: ModuleManifest): ClassDecorator {
  return (target) => appendRegistryRecord(target, "module", value);
}

/** @deprecated Use {@link RegisterModule} instead. */
export const RegistryModuleDefinition = RegisterModule;
