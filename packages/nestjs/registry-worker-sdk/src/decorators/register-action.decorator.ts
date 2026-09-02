/**
 * @file register-action.decorator.ts
 * @description Annotates a Nest class as an action in the application manifest.
 *
 * Actions represent operations that can be performed on resources. They
 * are surfaced in the Registry catalog and can carry an IAM permission key
 * that must be satisfied before the action may be invoked.
 *
 * @example
 * ```ts
 * \@RegisterAction({ key: 'invoice:create', resourceKey: 'invoice', permission: 'billing:invoice:create' })
 * \@Injectable()
 * export class InvoiceCommandService {}
 * ```
 */

import type { ActionManifest } from "../interfaces/registry-manifest.interface";
import { appendRegistryRecord } from "../utils/metadata.util";

/**
 * Declares an action on a resource in the application manifest.
 * @param value - Action descriptor.
 */
export function RegisterAction(value: ActionManifest): ClassDecorator {
  return (target) => appendRegistryRecord(target, "action", value);
}

/** @deprecated Use {@link RegisterAction} instead. */
export const RegistryAction = RegisterAction;
