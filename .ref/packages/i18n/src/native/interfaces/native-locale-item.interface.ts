/**
 * @file native-locale-item.interface.ts
 * @module @stackra/i18n/native/interfaces
 * @description Native alias for the canonical `LocaleItem` from
 *   `core/interfaces/`. Kept as an alias (not a re-export under
 *   the same name) to preserve the historical
 *   `NativeLocaleItem` import path for RN consumers while both
 *   platforms now render from a single canonical shape.
 */

import type { LocaleItem } from "../../core/interfaces/locale-item.interface";

/**
 * Native locale item — identical shape to `LocaleItem` from
 * `@stackra/i18n/core`. Kept as a named alias so the native
 * subpath's public API path stays stable.
 */
export type NativeLocaleItem = LocaleItem;
