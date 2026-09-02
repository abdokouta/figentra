/**
 * @file register-setting.decorator.ts
 * @description Annotates a Nest class as a configuration setting declaration in the application manifest.
 *
 * Setting declarations expose the **schema** of a configuration key — never its value.
 * Values are managed at runtime via the Figentra settings service.
 *
 * @example
 * ```ts
 * \@RegisterSetting({ key: 'stripe-api-key', type: 'string', required: true, sensitive: true })
 * \@Injectable()
 * export class StripeConfig {}
 * ```
 */

import type { SettingManifest } from "../interfaces/registry-manifest.interface";
import { appendRegistryRecord } from "../utils/metadata.util";

/**
 * Declares a configuration setting schema in the application manifest.
 * @param value - Setting descriptor.
 */
export function RegisterSetting(value: SettingManifest): ClassDecorator {
  return (target) => appendRegistryRecord(target, "setting", value);
}

/** @deprecated Use {@link RegisterSetting} instead. */
export const RegistrySetting = RegisterSetting;
