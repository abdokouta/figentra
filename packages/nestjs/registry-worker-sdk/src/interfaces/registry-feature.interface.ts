/**
 * @file registry-feature.interface.ts
 * @description Contracts for feature-level manifest contributions registered via RegistryModule.forFeature().
 */

import type {
  ActionManifest,
  CapabilityManifest,
  EventManifest,
  FeatureManifest,
  IntegrationManifest,
  LocalizationManifest,
  ModuleManifest,
  NavigationManifest,
  ResourceManifest,
  RouteManifest,
  SettingManifest,
  WidgetManifest,
  WorkflowManifest,
} from "./registry-manifest.interface";

/**
 * Feature contribution object passed to RegistryModule.forFeature().
 * Allows individual NestJS feature modules to declare their own slice of the application manifest.
 */
export interface RegistryFeature {
  /** Logical modules provided by this feature. */
  modules?: ModuleManifest[];
  /** Resources exposed by this feature. */
  resources?: ResourceManifest[];
  /** Actions declared by this feature. */
  actions?: ActionManifest[];
  /** Navigation links contributed by this feature. */
  navigation?: NavigationManifest[];
  /** Capability keys advertised by this feature. */
  capabilities?: CapabilityManifest[];
  /** Workflow definitions owned by this feature. */
  workflows?: WorkflowManifest[];
  /** Event contracts produced or consumed by this feature. */
  events?: EventManifest[];
  /** Third-party integrations declared by this feature. */
  integrations?: IntegrationManifest[];
  /** Configuration settings declared by this feature. */
  settings?: SettingManifest[];
  /** Feature flags declared by this feature. */
  features?: FeatureManifest[];
  /** UI widget descriptors contributed by this feature. */
  widgets?: WidgetManifest[];
  /** Localization namespaces contributed by this feature. */
  localization?: LocalizationManifest[];
  /** HTTP routes exposed by this feature. */
  routes?: RouteManifest[];
}
