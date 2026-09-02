/**
 * @file discovery.types.ts
 * @description Discovery metadata contracts used by the NestJS registry producer.
 */
import type {
  RegistryAction,
  RegistryCapability,
  RegistryEvent,
  RegistryFeatureFlag,
  RegistryIntegration,
  RegistryLocalization,
  RegistryModuleDefinition,
  RegistryNavigation,
  RegistryResource,
  RegistrySetting,
  RegistryWidget,
  RegistryWorkflow,
} from './registry.types.js';

/** Metadata collected from an annotated Nest provider/controller/class. */
export type RegistryDiscoveryRecord =
  | { kind: 'module'; value: RegistryModuleDefinition }
  | { kind: 'resource'; value: RegistryResource }
  | { kind: 'action'; value: RegistryAction }
  | { kind: 'navigation'; value: RegistryNavigation }
  | { kind: 'capability'; value: RegistryCapability }
  | { kind: 'workflow'; value: RegistryWorkflow }
  | { kind: 'event'; value: RegistryEvent }
  | { kind: 'integration'; value: RegistryIntegration }
  | { kind: 'setting'; value: RegistrySetting }
  | { kind: 'feature'; value: RegistryFeatureFlag }
  | { kind: 'widget'; value: RegistryWidget }
  | { kind: 'localization'; value: RegistryLocalization };

/** Metadata interface exposed by a registry discovery provider. */
export interface RegistryDiscoveryAdapter {
  collect(): RegistryDiscoveryRecord[];
}
