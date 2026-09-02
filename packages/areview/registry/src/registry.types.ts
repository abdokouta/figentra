/** Nest producer configuration for application registry registration. */
export interface RegistryModuleOptions {
  application: string;
  version: string;
  registryUrl: string;
  registrationToken?: string;
  environment?: 'development' | 'staging' | 'production';
  enabled?: boolean;
  failOnRegistrationError?: boolean;
  requireRegistrationToken?: boolean;
  registrationTimeoutMs?: number;
}

/** Registry resource descriptor. */
export interface RegistryResource { key: string; moduleKey?: string; metadata?: Record<string, unknown>; }
/** Registry action descriptor. */
export interface RegistryAction { key: string; resourceKey?: string; permission?: string; metadata?: Record<string, unknown>; }
/** Registry navigation descriptor. */
export interface RegistryNavigation { key: string; path: string; label?: string; icon?: string; permission?: string; metadata?: Record<string, unknown>; }
/** Registry module descriptor. */
export interface RegistryModuleDefinition { key: string; metadata?: Record<string, unknown>; }
/** Registry capability descriptor. */
export interface RegistryCapability { key: string; metadata?: Record<string, unknown>; }

/** Workflow inventory descriptor. Registry stores metadata, never executable code. */
export interface RegistryWorkflow {
  key: string;
  version?: string;
  description?: string;
  runtime: 'cloudflare-workflow';
  worker: string;
  binding?: string;
  trigger?: Record<string, unknown>;
  permissions?: string[];
  retry?: Record<string, unknown>;
  timeout?: string;
  metadata?: Record<string, unknown>;
}

/** Event contract inventory descriptor. */
export interface RegistryEvent { key: string; version?: string; direction: 'produces' | 'consumes'; topic: string; metadata?: Record<string, unknown>; }
/** External integration inventory descriptor. */
export interface RegistryIntegration { key: string; provider: string; kind?: string; metadata?: Record<string, unknown>; }
/** Public configuration metadata descriptor. Values are never registered here. */
export interface RegistrySetting { key: string; type: 'string' | 'number' | 'boolean' | 'json' | 'enum'; required?: boolean; sensitive?: boolean; metadata?: Record<string, unknown>; }
/** Feature exposure metadata descriptor. */
export interface RegistryFeatureFlag { key: string; defaultEnabled?: boolean; metadata?: Record<string, unknown>; }
/** UI widget inventory descriptor. */
export interface RegistryWidget { key: string; component: string; version?: string; metadata?: Record<string, unknown>; }
/** Localization inventory descriptor. */
export interface RegistryLocalization { key: string; namespace: string; locales: string[]; metadata?: Record<string, unknown>; }

/** Explicit feature contribution to the application manifest. */
export interface RegistryFeature {
  modules?: RegistryModuleDefinition[];
  resources?: RegistryResource[];
  actions?: RegistryAction[];
  navigation?: RegistryNavigation[];
  capabilities?: RegistryCapability[];
  workflows?: RegistryWorkflow[];
  events?: RegistryEvent[];
  integrations?: RegistryIntegration[];
  settings?: RegistrySetting[];
  features?: RegistryFeatureFlag[];
  widgets?: RegistryWidget[];
  localization?: RegistryLocalization[];
}

/** DI token for registry producer options. */
export const REGISTRY_OPTIONS = Symbol('STACKRA_REGISTRY_OPTIONS');
/** Reserved DI token for feature aggregation. */
export const REGISTRY_FEATURES = Symbol('STACKRA_REGISTRY_FEATURES');
/** Reflection key retained for registry metadata tooling. */
export const REGISTRY_FEATURE_METADATA = 'stackra:registry:feature';

/** Complete first-class Registry category metadata. */
export interface RegistryManifestExtras {
  eventDefinitions?: RegistryEvent[];
  workflowDefinitions?: RegistryWorkflow[];
  integrations?: RegistryIntegration[];
  settings?: RegistrySetting[];
  features?: RegistryFeatureFlag[];
  widgets?: RegistryWidget[];
  localization?: RegistryLocalization[];
}
