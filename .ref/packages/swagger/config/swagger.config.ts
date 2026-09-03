/**
 * @file swagger.config.ts
 * @module @stackra/nestjs-swagger/config
 * @description Default Swagger configuration template.
 *   Copy this file to your application's config/ directory and customize.
 */

import { IdefineConfig } from '@stackra/nestjs-swagger';

export default IdefineConfig({
  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ API Metadata                                                             │
  // └──────────────────────────────────────────────────────────────────────────┘

  title: process.env.SWAGGER_TITLE || 'Stackra API',
  description:
    process.env.SWAGGER_DESCRIPTION || '# API Documentation\n\nProduction-ready RESTful API.',
  version: process.env.API_VERSION || '1.0.0',

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ Routing                                                                  │
  // └──────────────────────────────────────────────────────────────────────────┘

  apiPath: process.env.SWAGGER_PATH || 'api/docs',
  enabled:
    process.env.SWAGGER_ENABLED === 'true' ||
    (process.env.SWAGGER_ENABLED !== 'false' && process.env.NODE_ENV !== 'production'),

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ Contact                                                                  │
  // └──────────────────────────────────────────────────────────────────────────┘

  contactName: process.env.SWAGGER_CONTACT_NAME || 'Stackra API Team',
  contactEmail: process.env.SWAGGER_CONTACT_EMAIL || 'api@stackra.com',
  contactUrl: process.env.SWAGGER_CONTACT_URL || 'https://stackra.com',

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ Servers                                                                  │
  // └──────────────────────────────────────────────────────────────────────────┘

  serverUrl: process.env.API_URL || 'http://localhost:3000',
  additionalServers: [],

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ Security                                                                 │
  // └──────────────────────────────────────────────────────────────────────────┘

  security: {
    jwt: {
      enabled: true,
      name: 'JWT-auth',
      description: 'JWT Bearer token authentication',
    },
    apiKey: {
      enabled: true,
      name: 'api-key',
      headerName: 'X-API-KEY',
      description: 'API Key for machine-to-machine auth',
    },
  },

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ Tags                                                                     │
  // └──────────────────────────────────────────────────────────────────────────┘

  tags: [],

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ Documents                                                                │
  // └──────────────────────────────────────────────────────────────────────────┘

  jsonDocumentUrl: process.env.SWAGGER_JSON_URL || 'api/docs-json',
  yamlDocumentUrl: process.env.SWAGGER_YAML_URL || 'api/docs-yaml',

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ UI                                                                       │
  // └──────────────────────────────────────────────────────────────────────────┘

  ui: {
    persistAuthorization: true,
    docExpansion: 'none',
    filter: true,
    showRequestDuration: true,
    tryItOutEnabled: true,
  },

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │ Branding                                                                 │
  // └──────────────────────────────────────────────────────────────────────────┘

  branding: {
    customSiteTitle: 'Stackra API — Documentation',
  },
});
