/**
 * @file registry-discovery.interface.ts
 * @description Contracts for the discovery-time metadata collection pipeline.
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
  SettingManifest,
  WidgetManifest,
  WorkflowManifest,
} from "./registry-manifest.interface";

/**
 * Discriminated union of all metadata records emitted by discovery decorators.
 * Each record carries a `kind` discriminant and a typed `value` for that kind.
 */
export type RegistryDiscoveryRecord =
  | { kind: "module"; value: ModuleManifest }
  | { kind: "resource"; value: ResourceManifest }
  | { kind: "action"; value: ActionManifest }
  | { kind: "navigation"; value: NavigationManifest }
  | { kind: "capability"; value: CapabilityManifest }
  | { kind: "workflow"; value: WorkflowManifest }
  | { kind: "event"; value: EventManifest }
  | { kind: "integration"; value: IntegrationManifest }
  | { kind: "setting"; value: SettingManifest }
  | { kind: "feature"; value: FeatureManifest }
  | { kind: "widget"; value: WidgetManifest }
  | { kind: "localization"; value: LocalizationManifest };

/**
 * Contract for metadata discovery adapters that scan the NestJS container.
 */
export interface IRegistryDiscoveryService {
  /**
   * Collects all registry discovery records from instantiated Nest providers and controllers.
   * @returns Array of typed discovery records sorted by registration order.
   */
  collect(): RegistryDiscoveryRecord[];
}
