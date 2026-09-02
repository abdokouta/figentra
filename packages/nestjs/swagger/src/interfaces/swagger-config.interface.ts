import type { SwaggerAdvanced } from "./swagger-advanced.interface";
import type { SwaggerBranding } from "./swagger-branding.interface";
import type { SwaggerDocuments } from "./swagger-documents.interface";
import type { SwaggerExternalDocs } from "./swagger-external-docs.interface";
import type { SwaggerLicense } from "./swagger-license.interface";
import type { SwaggerSecurity } from "./swagger-security.interface";
import type { SwaggerServer } from "./swagger-server.interface";
import type { SwaggerTag } from "./swagger-tag.interface";
import type { SwaggerUIConfig } from "./swagger-ui-config.interface";

/**
 * Swagger Configuration Interface
 *
 * Complete type definition for Swagger/OpenAPI configuration.
 * Controls all aspects of API documentation including UI, security, and metadata.
 *
 * @interface SwaggerConfig
 * @author Nesvel
 * @since 1.0.0
 */
export interface SwaggerConfig {
  /**
   * API title displayed in Swagger UI
   * @env SWAGGER_TITLE
   * @default 'Nesvel API'
   * @example 'My Awesome API'
   */
  title: string;

  /**
   * API description (supports markdown)
   * Displayed at the top of Swagger UI documentation
   * @env SWAGGER_DESCRIPTION
   * @default 'Production-ready API documentation for Nesvel platform'
   */
  description: string;

  /**
   * API version (semver format)
   * @env API_VERSION
   * @default '1.0.0'
   * @example '2.1.3'
   */
  version: string;

  /**
   * URL path where Swagger UI is served
   * @env SWAGGER_PATH
   * @default 'api/docs'
   * @example 'docs', 'swagger'
   */
  apiPath: string;

  /**
   * Whether Swagger UI is enabled
   * Typically disabled in production for security
   * @env SWAGGER_ENABLED
   * @default false (production), true (development)
   */
  enabled: boolean;

  /**
   * Contact email for API support
   * @env SWAGGER_CONTACT_EMAIL
   * @default 'api@nesvel.com'
   * @example 'support@example.com'
   */
  contactEmail: string;

  /**
   * Contact name for API support
   * @env SWAGGER_CONTACT_NAME
   * @default 'Nesvel API Team'
   * @example 'API Support Team'
   */
  contactName: string;

  /**
   * Contact URL for API support
   * @env SWAGGER_CONTACT_URL
   * @default 'https://nesvel.com'
   * @example 'https://support.example.com'
   */
  contactUrl: string;

  /**
   * URL to the API's Terms of Service
   * @env SWAGGER_TERMS_URL
   * @optional
   * @example 'https://example.com/terms'
   */
  termsOfService?: string;

  /**
   * License information for the API
   * @env SWAGGER_LICENSE_NAME, SWAGGER_LICENSE_URL
   * @optional
   */
  license?: SwaggerLicense;

  /**
   * Primary API server URL
   * Used for "Try it out" functionality
   * @env API_URL
   * @default 'http://localhost:3000'
   * @example 'https://api.example.com'
   */
  serverUrl: string;

  /**
   * Additional server URLs
   * Allows testing against multiple environments
   * @env SWAGGER_ADDITIONAL_SERVERS (comma-separated)
   * @example [{ url: 'https://staging.api.com', description: 'Staging' }]
   */
  additionalServers: SwaggerServer[];

  /**
   * Endpoint tags for grouping operations
   * Organizes endpoints by functionality in Swagger UI
   * @example [{ name: 'users', description: 'User endpoints' }]
   */
  tags: SwaggerTag[];

  /**
   * Security scheme configurations
   * Defines available authentication methods
   */
  security: SwaggerSecurity;

  /**
   * External documentation links
   * @env SWAGGER_EXTERNAL_DOCS_URL, SWAGGER_EXTERNAL_DOCS_DESCRIPTION
   * @optional
   */
  externalDocs?: SwaggerExternalDocs;

  /**
   * Swagger UI configuration options
   */
  ui: SwaggerUIConfig;

  /**
   * OpenAPI document URLs
   * Raw specification file endpoints
   */
  documents: SwaggerDocuments;

  /**
   * Custom branding options
   */
  branding: SwaggerBranding;

  /**
   * Advanced configuration options
   */
  advanced: SwaggerAdvanced;
}
