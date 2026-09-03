/**
 * @file swagger-security.interface.ts
 * @module @stackra/nestjs-swagger/interfaces
 * @description Interfaces for authentication scheme configuration.
 */

/**
 * Combined security configuration for all authentication schemes.
 */
export interface ISwaggerSecurity {
  /** JWT Bearer authentication. */
  jwt: ISwaggerJwtConfig;
  /** API Key authentication. */
  apiKey: ISwaggerApiKeyConfig;
  /** OAuth2 authentication. */
  oauth2?: ISwaggerOAuth2Config;
}
