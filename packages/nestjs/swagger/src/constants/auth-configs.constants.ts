/**
 * Default Authentication Configurations
 *
 * Predefined authentication scheme configurations for common authentication patterns.
 * These configurations are used to set up authentication in the Swagger/OpenAPI documentation.
 *
 * @constant DEFAULT_AUTH_CONFIGS
 *
 * @property {Object} JWT - JWT Bearer authentication configuration
 * @property {Object} API_KEY - API Key authentication configuration
 *
 * @example
 * ```typescript
 * import { DocumentBuilder } from '@nesvel/nestjs-swagger';
 * import { DEFAULT_AUTH_CONFIGS, AUTH_SCHEMES } from './constants';
 *
 * const config = DocumentBuilder.make()
 *   .addBearerAuth(DEFAULT_AUTH_CONFIGS.JWT, AUTH_SCHEMES.JWT)
 *   .addApiKey(DEFAULT_AUTH_CONFIGS.API_KEY, AUTH_SCHEMES.API_KEY)
 *   .build();
 * ```
 */
export const DEFAULT_AUTH_CONFIGS = {
  /**
   * JWT Bearer Authentication Configuration
   *
   * Configures JWT-based authentication using the Authorization header.
   * Clients must include the JWT token in the format: `Authorization: Bearer <token>`
   *
   * @property {string} type - Authentication type ('http')
   * @property {string} scheme - HTTP authentication scheme ('bearer')
   * @property {string} bearerFormat - Token format hint ('JWT')
   * @property {string} name - Display name for this authentication scheme
   * @property {string} description - Help text for users
   * @property {string} in - Location of the authentication parameter ('header')
   *
   * @example Token Usage
   * ```
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   * ```
   */
  JWT: {
    type: "http" as const,
    scheme: "bearer",
    bearerFormat: "JWT",
    name: "JWT",
    description: "Enter JWT token",
    in: "header" as const,
  },

  /**
   * API Key Authentication Configuration
   *
   * Configures API key-based authentication using a custom header.
   * Clients must include the API key in the X-API-KEY header.
   *
   * @property {string} type - Authentication type ('apiKey')
   * @property {string} name - Header name where the API key should be sent
   * @property {string} in - Location of the authentication parameter ('header')
   * @property {string} description - Help text for users
   *
   * @example API Key Usage
   * ```
   * X-API-KEY: your-api-key-here
   * ```
   *
   * @remarks
   * Consider using environment-specific API keys and rotating them regularly.
   * Never commit API keys to version control.
   */
  API_KEY: {
    type: "apiKey" as const,
    name: "X-API-KEY",
    in: "header" as const,
    description: "API Key for authorization",
  },
};
