/**
 * @file default-settings-config.constant.ts
 * @module @stackra/settings/core/constants
 * @description Canonical defaults for {@link ISettingsModuleOptions}.
 *   Spread inline by `SettingsModule.forRoot(options)` (per
 *   ADR-0063 — no `mergeConfig` util) so both static and DI-first
 *   paths produce the same fully-populated shape.
 */

import type { ISettingsConfig } from "@stackra/contracts";

import { DEFAULT_API_ENDPOINTS } from "./api-endpoints.constant";

/**
 * Default resolved settings module configuration.
 */
export const DEFAULT_SETTINGS_CONFIG: ISettingsConfig = {
  default: "localStorage",
  stores: {
    memory: { driver: "memory" },
    localStorage: { driver: "storage", storageInstance: "localStorage" },
  },
  prefix: "stackra:settings",
  debounce: true,
  debounceMs: 300,
  api: {
    httpClient: "default",
    endpoints: DEFAULT_API_ENDPOINTS,
    autoLoadSchema: false,
    autoLoadValues: false,
    cacheSchemaStore: false,
  },
  broadcasting: {
    enabled: false,
    channelPrefix: "settings",
    connection: "default",
  },
};
