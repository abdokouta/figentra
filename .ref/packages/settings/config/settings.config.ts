/**
 * @file settings.config.ts
 * @module @stackra/settings/config
 * @description Consumer template for the settings module's
 *   namespaced configuration factory.
 *
 *   Registers under `SETTINGS_CONFIG` (the string constant
 *   `"settings"` from `@stackra/contracts`). Every optional field
 *   of `ISettingsModuleOptions` carries an inline default here.
 *
 *   Codified by ADR-0063 — Unified DI-first config pattern.
 */

import { env, registerAs } from "@stackra/config";
import { SETTINGS_CONFIG, type ISettingsModuleOptions } from "@stackra/contracts";

export const settingsConfig = registerAs<ISettingsModuleOptions>(SETTINGS_CONFIG, () => ({
  /*
  |--------------------------------------------------------------------------
  | Default Store
  |--------------------------------------------------------------------------
  */
  default: env("SETTINGS_DEFAULT", "localStorage"),

  /*
  |--------------------------------------------------------------------------
  | Stores
  |--------------------------------------------------------------------------
  |
  | Named store configurations keyed by instance name. Consumers who
  | want the settings API-backed store add an `api` entry here.
  |
  */
  stores: {
    memory: { driver: "memory" },
    localStorage: { driver: "storage", storageInstance: "localStorage" },
  },

  /*
  |--------------------------------------------------------------------------
  | Key Prefix
  |--------------------------------------------------------------------------
  */
  prefix: env("SETTINGS_PREFIX", "stackra:settings"),

  /*
  |--------------------------------------------------------------------------
  | Debounce
  |--------------------------------------------------------------------------
  */
  debounce: env.bool("SETTINGS_DEBOUNCE", true),
  debounceMs: env.number("SETTINGS_DEBOUNCE_MS", 300),

  /*
  |--------------------------------------------------------------------------
  | API Sub-Config
  |--------------------------------------------------------------------------
  */
  api: {
    httpClient: env("SETTINGS_HTTP_CLIENT", "default"),
    autoLoadSchema: env.bool("SETTINGS_AUTO_LOAD_SCHEMA", false),
    autoLoadValues: env.bool("SETTINGS_AUTO_LOAD_VALUES", false),
  },

  /*
  |--------------------------------------------------------------------------
  | Broadcasting Sub-Config
  |--------------------------------------------------------------------------
  */
  broadcasting: {
    enabled: env.bool("SETTINGS_BROADCASTING", false),
    channelPrefix: env("SETTINGS_BROADCAST_PREFIX", "settings"),
    connection: env("SETTINGS_BROADCAST_CONNECTION", "default"),
  },
}));
