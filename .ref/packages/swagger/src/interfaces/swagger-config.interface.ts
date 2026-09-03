/**
 * @file swagger-config.interface.ts
 * @module @stackra/nestjs-swagger/interfaces
 * @description Main Swagger module configuration interface.
 */

import type { ISwaggerTag } from './swagger-tag.interface';
import type { ISwaggerServer } from './swagger-server.interface';
import type { ISwaggerSecurity } from './swagger-security.interface';
import type { ISwaggerBranding } from './swagger-branding.interface';
import type { ISwaggerUIOptions } from './swagger-ui.interface';

/**
 * Complete Swagger/OpenAPI module configuration.
 *
 * Controls all aspects of API documentation including metadata, security,
 * servers, UI behavior, and branding.
 */
export interface ISwaggerConfig {
  // ── API Metadata ──────────────────────────────────────────────────────────

  /** API title displayed in Swagger UI header. */
  title: string;

  /** API description (supports Markdown). */
  description: string;

  /** API version (semver format). */
  version: string;

  // ── Routing ───────────────────────────────────────────────────────────────

  /** URL path where Swagger UI is served (e.g., 'api/docs'). */
  apiPath: string;

  /** Whether Swagger is enabled. Typically disabled in production. */
  enabled: boolean;

  // ── Contact ───────────────────────────────────────────────────────────────

  /** Contact name for API support. */
  contactName?: string;

  /** Contact email for API support. */
  contactEmail?: string;

  /** Contact URL for API support. */
  contactUrl?: string;

  /** Terms of Service URL. */
  termsOfService?: string;

  /** License information. */
  license?: { name: string; url?: string };

  // ── Servers ───────────────────────────────────────────────────────────────

  /** Primary server URL for "Try it out" (e.g., 'http://localhost:3000'). */
  serverUrl: string;

  /** Additional server environments (staging, production). */
  additionalServers?: ISwaggerServer[];

  // ── Organization ──────────────────────────────────────────────────────────

  /** Endpoint tags for grouping operations. */
  tags?: ISwaggerTag[];

  // ── Security ──────────────────────────────────────────────────────────────

  /** Authentication scheme configuration. */
  security?: ISwaggerSecurity;

  // ── Documents ─────────────────────────────────────────────────────────────

  /** Path for the JSON spec endpoint (e.g., 'api/docs-json'). */
  jsonDocumentUrl?: string;

  /** Path for the YAML spec endpoint (e.g., 'api/docs-yaml'). */
  yamlDocumentUrl?: string;

  // ── UI & Branding ─────────────────────────────────────────────────────────

  /** Swagger UI behavior options. */
  ui?: ISwaggerUIOptions;

  /** Visual customization and branding. */
  branding?: ISwaggerBranding;

  // ── Advanced ──────────────────────────────────────────────────────────────

  /** Operation ID factory function. */
  operationIdFactory?: (controllerKey: string, methodKey: string) => string;

  /** Deep-scan routes including dynamic modules. */
  deepScanRoutes?: boolean;

  /** Ignore global prefix in paths. */
  ignoreGlobalPrefix?: boolean;
}
