/**
 * @file is-value-provider.util.ts
 * @module utils/is-value-provider
 * @description isValueProvider Type Guard
 *
 *   Determines whether a provider uses `useValue` to bind a token
 *   to a pre-existing value with no instantiation.
 */

import { Provider, ValueProvider } from "@stackra/contracts";
import { isCustomProvider } from "@/core/utils/is-custom-provider.util";

/**
 * Check if a provider uses `useValue`.
 *
 * Value providers bind a token to a pre-existing value with no
 * instantiation or dependency resolution.
 *
 * @param provider - The provider to check
 * @returns `true` if the provider has both `provide` and `useValue` properties
 *
 * @example
 * ```typescript
 * isValueProvider({ provide: 'API_URL', useValue: 'https://...' }); // true
 * isValueProvider({ provide: DB, useFactory: () => connect() });    // false
 * ```
 */
export function isValueProvider(
  provider: Provider,
): provider is ValueProvider {
  return isCustomProvider(provider) && "useValue" in provider;
}
