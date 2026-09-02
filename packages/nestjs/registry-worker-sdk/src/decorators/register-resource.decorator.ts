/**
 * @file register-resource.decorator.ts
 * @description Annotates a Nest class as a resource in the application manifest.
 *
 * Resources are addressable data entities exposed by the application.
 * They are typically associated with a module via `moduleKey`.
 *
 * @example
 * ```ts
 * \@RegisterResource({ key: 'invoice', moduleKey: 'billing' })
 * \@Injectable()
 * export class InvoiceService {}
 * ```
 */

import type { ResourceManifest } from "../interfaces/registry-manifest.interface";
import { appendRegistryRecord } from "../utils/metadata.util";

/**
 * Declares an addressable resource in the application manifest.
 * @param value - Resource descriptor.
 */
export function RegisterResource(value: ResourceManifest): ClassDecorator {
  return (target) => appendRegistryRecord(target, "resource", value);
}

/** @deprecated Use {@link RegisterResource} instead. */
export const RegistryResource = RegisterResource;
