/**
 * @file index.ts
 * @description Barrel export for all @figentra/registry interfaces.
 */

export type { ApplicationManifest, EnvironmentManifest, ModuleManifest, ResourceManifest, ActionManifest, NavigationManifest, CapabilityManifest, WorkflowManifest, EventManifest, IntegrationManifest, SettingManifest, FeatureManifest, WidgetManifest, LocalizationManifest, RouteManifest } from "./registry-manifest.interface";
export type { RegistryModuleOptions, RegistryModuleAsyncOptions, RegistryOptionsFactory } from "./registry-options.interface";
export type { RegistryFeature } from "./registry-feature.interface";
export type { IRegistryClientService, RegistrationResponse, CatalogQueryOptions, RouteResolutionResult } from "./registry-client.interface";
export type { IRegistryDiscoveryService, RegistryDiscoveryRecord } from "./registry-discovery.interface";
