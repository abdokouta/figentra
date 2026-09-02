/**
 * @file registry-manifest.interface.ts
 * @description Canonical contract interfaces for Figentra application manifests and descriptors.
 */

export interface EnvironmentManifest {
  environment: string;
  deploymentUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface ModuleManifest {
  key: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface ResourceManifest {
  moduleKey?: string;
  key: string;
  label?: string;
  metadata?: Record<string, unknown>;
}

export interface ActionManifest {
  resourceKey?: string;
  key: string;
  permission?: string;
  metadata?: Record<string, unknown>;
}

export interface NavigationManifest {
  key: string;
  path: string;
  label?: string;
  icon?: string;
  permission?: string;
  metadata?: Record<string, unknown>;
}

export interface CapabilityManifest {
  key: string;
  metadata?: Record<string, unknown>;
}

export interface WorkflowManifest {
  key: string;
  version?: string;
  description?: string;
  runtime?: "cloudflare-workflow";
  worker?: string;
  binding?: string;
  trigger?: Record<string, unknown>;
  permissions?: string[];
  retry?: Record<string, unknown>;
  timeout?: string;
  metadata?: Record<string, unknown>;
}

export interface EventManifest {
  key: string;
  version?: string;
  direction?: "produces" | "consumes";
  topic?: string;
  metadata?: Record<string, unknown>;
}

export interface IntegrationManifest {
  key: string;
  provider: string;
  kind?: string;
  metadata?: Record<string, unknown>;
}

export interface SettingManifest {
  key: string;
  type: "string" | "number" | "boolean" | "json" | "enum";
  required?: boolean;
  sensitive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface FeatureManifest {
  key: string;
  defaultEnabled?: boolean;
  metadata?: Record<string, unknown>;
}

export interface WidgetManifest {
  key: string;
  component: string;
  version?: string;
  metadata?: Record<string, unknown>;
}

export interface LocalizationManifest {
  key: string;
  namespace: string;
  locales: string[];
  metadata?: Record<string, unknown>;
}

export interface RouteManifest {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";
  pathPattern: string;
  upstream: string;
  audience: string;
  requiredPermission?: string;
  metadata?: Record<string, unknown>;
}

/** Complete canonical application manifest submitted to Registry Worker. */
export interface ApplicationManifest {
  slug: string;
  displayName: string;
  description?: string;
  version: string;
  branding?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  environments?: EnvironmentManifest[];
  capabilities?: string[];
  modules?: ModuleManifest[];
  resources?: ResourceManifest[];
  actions?: ActionManifest[];
  workflowDefinitions?: WorkflowManifest[];
  eventDefinitions?: EventManifest[];
  integrations?: IntegrationManifest[];
  settings?: SettingManifest[];
  features?: FeatureManifest[];
  widgets?: WidgetManifest[];
  localization?: LocalizationManifest[];
  navigation?: NavigationManifest[];
  routes?: RouteManifest[];
}
