/**
 * @file application-manifest.schema.ts
 * @description Canonical validation schema for application registration.
 */
import { z } from 'zod';

const permissionSchema = z.string().regex(/^[a-z0-9][a-z0-9._:-]{1,199}$/);

/**
 * Validates the complete application metadata contract submitted to Registry.
 */
export const applicationManifestSchema = z.object({
  /** Stable application slug. */
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,62}$/),
  /** Human-readable application name. */
  displayName: z.string().min(1).max(120),
  /** Optional description. */
  description: z.string().max(1000).optional(),
  /** Immutable semantic version. */
  version: z.string().regex(/^v?\d+\.\d+\.\d+([+-][0-9A-Za-z.-]+)?$/),
  /** Theme and branding metadata. */
  branding: z.record(z.string(), z.unknown()).optional(),
  /** Application metadata. */
  metadata: z.record(z.string(), z.unknown()).optional(),
  /** Deployment environment metadata. */
  environments: z.array(z.record(z.string(), z.unknown())).max(100).optional(),
  /** Declared platform capabilities. */
  capabilities: z.array(z.string().min(1).max(100)).max(100).optional(),
  /** Application modules. */
  modules: z.array(z.record(z.string(), z.unknown())).max(100).optional(),
  /** Application resources. */
  resources: z.array(z.record(z.string(), z.unknown())).max(100).optional(),
  /** Application actions. */
  actions: z.array(z.record(z.string(), z.unknown())).max(100).optional(),
  /** First-class versioned workflow metadata. */
  workflowDefinitions: z.array(z.object({
    key: z.string().min(1).max(160),
    version: z.string().min(1).max(64).optional(),
    description: z.string().max(1000).optional(),
    runtime: z.literal('cloudflare-workflow'),
    worker: z.string().min(1).max(160),
    binding: z.string().min(1).max(160).optional(),
    trigger: z.record(z.string(), z.unknown()).optional(),
    permissions: z.array(permissionSchema).max(100).optional(),
    retry: z.record(z.string(), z.unknown()).optional(),
    timeout: z.string().max(64).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })).max(500).optional(),
  /** First-class event contract metadata. */
  eventDefinitions: z.array(z.object({
    key: z.string().min(1).max(160),
    version: z.string().min(1).max(64).optional(),
    direction: z.enum(['produces', 'consumes']),
    topic: z.string().min(1).max(250),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })).max(500).optional(),
  /** First-class external integration metadata. */
  integrations: z.array(z.object({
    key: z.string().min(1).max(160),
    provider: z.string().min(1).max(160),
    kind: z.string().min(1).max(120).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })).max(500).optional(),
  /** First-class public configuration metadata; values must not contain secrets. */
  settings: z.array(z.object({
    key: z.string().min(1).max(160),
    type: z.enum(['string', 'number', 'boolean', 'json', 'enum']),
    required: z.boolean().optional(),
    sensitive: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })).max(500).optional(),
  /** First-class feature exposure metadata. */
  features: z.array(z.object({
    key: z.string().min(1).max(160),
    defaultEnabled: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })).max(500).optional(),
  /** First-class UI widget metadata. */
  widgets: z.array(z.object({
    key: z.string().min(1).max(160),
    component: z.string().min(1).max(250),
    version: z.string().min(1).max(64).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })).max(500).optional(),
  /** First-class localization metadata. */
  localization: z.array(z.object({
    key: z.string().min(1).max(160),
    namespace: z.string().min(1).max(160),
    locales: z.array(z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/)).max(100),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })).max(500).optional(),
  /** UI navigation inventory. */
  navigation: z.array(z.object({
    key: z.string().min(1).max(120),
    path: z.string().startsWith("/").max(500),
    label: z.string().max(200).optional(),
    icon: z.string().max(120).optional(),
    permission: permissionSchema.optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })).max(500).optional(),
  /** Gateway-routable HTTP routes. */
  routes: z.array(z.object({
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']),
    pathPattern: z.string().startsWith('/'),
    upstream: z.string().url(),
    audience: z.string().min(1).max(200),
    requiredPermission: permissionSchema.optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })),
});
