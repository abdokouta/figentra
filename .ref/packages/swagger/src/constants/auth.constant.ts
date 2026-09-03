/**
 * @file auth.constant.ts
 * @module @stackra/nestjs-swagger/constants
 * @description Default authentication scheme identifiers and configurations.
 */

// ============================================================================
// Scheme Identifiers
// ============================================================================

/**
 * Authentication scheme identifiers used in `@ApiBearerAuth()` / `@ApiSecurity()`.
 */
export const AUTH_SCHEMES = {
  /** JWT Bearer authentication scheme. */
  JWT: 'JWT-auth',
  /** API Key authentication scheme. */
  API_KEY: 'api-key',
  /** OAuth2 authentication scheme. */
  OAUTH2: 'oauth2',
} as const;

// ============================================================================
// Default Configurations
// ============================================================================

/**
 * Default authentication configurations for the DocumentBuilder.
 */
export const DEFAULT_AUTH_CONFIGS = {
  /** JWT Bearer — Authorization: Bearer <token>. */
  JWT: {
    type: 'http' as const,
    scheme: 'bearer',
    bearerFormat: 'JWT',
    name: 'JWT',
    description: 'Enter JWT access token',
    in: 'header' as const,
  },
  /** API Key — X-API-KEY header. */
  API_KEY: {
    type: 'apiKey' as const,
    name: 'X-API-KEY',
    in: 'header' as const,
    description: 'API Key for machine-to-machine authentication',
  },
} as const;
