/**
 * @file register-localization.decorator.ts
 * @description Annotates a Nest class as a localization namespace in the application manifest.
 *
 * Localization declarations expose the i18n namespaces and supported locales
 * so that the platform can discover and preload translation bundles.
 *
 * @example
 * ```ts
 * \@RegisterLocalization({ key: 'billing-i18n', namespace: 'billing', locales: ['en', 'ar', 'fr'] })
 * \@Injectable()
 * export class BillingI18nService {}
 * ```
 */

import type { LocalizationManifest } from "../interfaces/registry-manifest.interface";
import { appendRegistryRecord } from "../utils/metadata.util";

/**
 * Declares a localization namespace in the application manifest.
 * @param value - Localization descriptor.
 */
export function RegisterLocalization(value: LocalizationManifest): ClassDecorator {
  return (target) => appendRegistryRecord(target, "localization", value);
}

/** @deprecated Use {@link RegisterLocalization} instead. */
export const RegistryLocalization = RegisterLocalization;
