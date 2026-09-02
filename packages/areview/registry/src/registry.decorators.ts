/**
 * @file registry.decorators.ts
 * @description NestJS decorators for declarative application registry metadata.
 */
import 'reflect-metadata';
import type {
  RegistryAction as RegistryActionContract,
  RegistryCapability as RegistryCapabilityContract,
  RegistryEvent,
  RegistryFeatureFlag,
  RegistryIntegration,
  RegistryLocalization,
  RegistryModuleDefinition as RegistryModuleContract,
  RegistryNavigation as RegistryNavigationContract,
  RegistryResource as RegistryResourceContract,
  RegistrySetting,
  RegistryWidget,
  RegistryWorkflow,
} from './registry.types.js';
import type { RegistryDiscoveryRecord } from './discovery.types.js';

/** Reflection key for registry discovery records. */
export const REGISTRY_DISCOVERY_METADATA = Symbol.for('figentra:registry:discovery');

type RegistryDecoratorKind = RegistryDiscoveryRecord['kind'];
type Metadata = RegistryDiscoveryRecord['value'];

function appendMetadata(target: Function, kind: RegistryDecoratorKind, value: Metadata): void {
  const existing = (Reflect.getMetadata(REGISTRY_DISCOVERY_METADATA, target) ?? []) as RegistryDiscoveryRecord[];
  Reflect.defineMetadata(REGISTRY_DISCOVERY_METADATA, [...existing, { kind, value }], target);
}

export function RegistryModuleDefinition(value: RegistryModuleContract): ClassDecorator { return (target) => appendMetadata(target, 'module', value); }
export function RegistryResource(value: RegistryResourceContract): ClassDecorator { return (target) => appendMetadata(target, 'resource', value); }
export function RegistryAction(value: RegistryActionContract): ClassDecorator { return (target) => appendMetadata(target, 'action', value); }
export function RegistryNavigation(value: RegistryNavigationContract): ClassDecorator { return (target) => appendMetadata(target, 'navigation', value); }
export function RegistryCapability(value: RegistryCapabilityContract): ClassDecorator { return (target) => appendMetadata(target, 'capability', value); }
export function RegistryWorkflow(value: RegistryWorkflow): ClassDecorator { return (target) => appendMetadata(target, 'workflow', value); }
export function RegistryEvent(value: RegistryEvent): ClassDecorator { return (target) => appendMetadata(target, 'event', value); }
export function RegistryIntegration(value: RegistryIntegration): ClassDecorator { return (target) => appendMetadata(target, 'integration', value); }
export function RegistrySetting(value: RegistrySetting): ClassDecorator { return (target) => appendMetadata(target, 'setting', value); }
export function RegistryFeature(value: RegistryFeatureFlag): ClassDecorator { return (target) => appendMetadata(target, 'feature', value); }
export function RegistryWidget(value: RegistryWidget): ClassDecorator { return (target) => appendMetadata(target, 'widget', value); }
export function RegistryLocalization(value: RegistryLocalization): ClassDecorator { return (target) => appendMetadata(target, 'localization', value); }
