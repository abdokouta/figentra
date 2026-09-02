/**
 * @file src/index.ts
 * @description Public API surface for the @figentra/registry-worker-sdk NestJS package.
 *
 * Single entry-point exposing module, decorators, services, interfaces, helpers, and constants.
 */

// Module
export { RegistryModule } from "./registry.module";

// Services
export {
  RegistryService,
  RegistryClientService,
  RegistryClientError,
  RegistryDiscoveryService,
} from "./services";

// Helpers
export {
  buildRegistryUrl,
  buildRegistryHeaders,
  fetchWithRetry,
} from "./helpers";

// Utils
export { appendRegistryRecord } from "./utils";

// Decorators
export {
  RegisterModule,
  RegisterResource,
  RegisterAction,
  RegisterNavigation,
  RegisterCapability,
  RegisterWorkflow,
  RegisterEvent,
  RegisterIntegration,
  RegisterSetting,
  RegisterFeature,
  RegisterWidget,
  RegisterLocalization,
  // Legacy aliases
  RegistryModuleDefinition,
  RegistryResource,
  RegistryAction,
  RegistryNavigation,
  RegistryCapability,
  RegistryWorkflow,
  RegistryEvent,
  RegistryIntegration,
  RegistrySetting,
  RegistryWidget,
  RegistryLocalization,
} from "./decorators";

// Interfaces
export type {
  ApplicationManifest,
  EnvironmentManifest,
  ModuleManifest,
  ResourceManifest,
  ActionManifest,
  NavigationManifest,
  CapabilityManifest,
  WorkflowManifest,
  EventManifest,
  IntegrationManifest,
  SettingManifest,
  FeatureManifest,
  WidgetManifest,
  LocalizationManifest,
  RouteManifest,
} from "./interfaces/registry-manifest.interface";

export type {
  RegistryModuleOptions,
  RegistryModuleAsyncOptions,
  RegistryOptionsFactory,
} from "./interfaces/registry-options.interface";

export type { RegistryFeature } from "./interfaces/registry-feature.interface";

export type {
  IRegistryClientService,
  RegistrationResponse,
  CatalogQueryOptions,
  RouteResolutionResult,
} from "./interfaces/registry-client.interface";

export type {
  IRegistryDiscoveryService,
  RegistryDiscoveryRecord,
} from "./interfaces/registry-discovery.interface";

// Constants
export {
  REGISTRY_MODULE_OPTIONS,
  REGISTRY_OPTIONS,
  REGISTRY_CLIENT,
  REGISTRY_FEATURES,
  REGISTRY_DISCOVERY_METADATA,
} from "./constants/registry.constants";
