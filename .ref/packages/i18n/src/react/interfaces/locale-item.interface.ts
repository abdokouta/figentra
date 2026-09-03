/**
 * @file locale-item.interface.ts
 * @module @stackra/i18n/react/interfaces
 * @description Re-export of the canonical `LocaleItem` from
 *   `core/interfaces/` so the react subpath's public API path
 *   stays stable while both platform subpaths + `II18nConfig`
 *   share one definition. Do not edit the shape here — modify
 *   `core/interfaces/locale-item.interface.ts` instead.
 */

export type { LocaleItem } from "../../core/interfaces/locale-item.interface";
