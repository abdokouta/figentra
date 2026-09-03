/**
 * @file index.ts
 * @module @stackra/vite/core/interfaces
 * @description Public API barrel for the `interfaces` category.
 */

export type { IPluginEntry } from "./plugin-entry.interface";
export type { IPluginMap } from "./plugin-map.interface";
export type {
  IReadDevHttpsOptions,
  IReadDevHttpsResult,
} from "./read-dev-https.interface";
export type {
  IResolveAppMetaOptions,
  IResolveAppMetaResult,
} from "./resolve-app-meta.interface";
export type {
  IResolveDevHostConfigOptions,
  IResolveDevHostConfigResult,
  IResolveDevHostConfigSlice,
} from "./resolve-dev-host-config.interface";
export type { IViteConfigOptions } from "./vite-config-options.interface";
