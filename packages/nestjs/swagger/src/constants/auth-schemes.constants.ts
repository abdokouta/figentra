/**
 * Authentication Scheme Identifiers
 *
 * Defines the unique identifiers for authentication schemes used in the Swagger documentation.
 * These identifiers are referenced when applying authentication to specific API operations.
 *
 * @constant AUTH_SCHEMES
 *
 * @property {string} JWT - Identifier for JWT Bearer authentication
 * @property {string} API_KEY - Identifier for API Key authentication
 *
 * @example Using in decorators
 * ```typescript
 * import { ApiBearerAuth, ApiSecurity } from '@nesvel/nestjs-swagger';
 * import { AUTH_SCHEMES } from './constants';
 *
 * @ApiBearerAuth(AUTH_SCHEMES.JWT)
 * @Get('protected')
 * getProtectedResource() {
 *   // This endpoint requires JWT authentication
 * }
 *
 * @ApiSecurity(AUTH_SCHEMES.API_KEY)
 * @Get('api-protected')
 * getApiKeyProtectedResource() {
 *   // This endpoint requires API Key authentication
 * }
 * ```
 *
 * @remarks
 * These identifiers must match the names used when configuring
 * authentication schemes in the Swagger document builder.
 */
export const AUTH_SCHEMES = {
  /**
   * JWT Bearer Authentication Scheme Identifier
   *
   * Used for endpoints that require JWT token authentication.
   * The token should be provided in the Authorization header as: `Bearer <token>`
   *
   * @example
   * ```typescript
   * @ApiBearerAuth('JWT-auth')
   * @Get('profile')
   * getProfile() { ... }
   * ```
   */
  JWT: "JWT-auth",

  /**
   * API Key Authentication Scheme Identifier
   *
   * Used for endpoints that require API key authentication.
   * The API key should be provided in the X-API-KEY header.
   *
   * @example
   * ```typescript
   * @ApiSecurity('api-key')
   * @Get('data')
   * getData() { ... }
   * ```
   */
  API_KEY: "api-key",
} as const;
