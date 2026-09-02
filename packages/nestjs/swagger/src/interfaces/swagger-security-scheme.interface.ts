/**
 * Swagger Security Scheme Configuration
 *
 * Defines authentication and authorization schemes available in the API.
 * Supports JWT, API Key, and OAuth2 authentication methods.
 *
 * @interface SwaggerSecurityScheme
 * @author Nesvel
 * @since 1.0.0
 */
export interface SwaggerSecurityScheme {
  /**
   * Whether this security scheme is enabled
   * @default false
   */
  enabled: boolean;

  /**
   * Unique identifier for the security scheme
   * Used in Swagger UI and OpenAPI specification
   * @example 'JWT-auth', 'api-key', 'oauth2'
   */
  name: string;

  /**
   * Human-readable description of the security scheme
   * Displayed in Swagger UI to help developers understand how to authenticate
   * @example 'JWT Bearer token authentication'
   */
  description: string;

  /**
   * HTTP header name for API key authentication
   * Only applicable for API Key authentication type
   * @example 'X-API-KEY'
   * @optional
   */
  headerName?: string;

  /**
   * OAuth2 authorization URL
   * Only applicable for OAuth2 authentication type
   * @example 'https://auth.example.com/oauth/authorize'
   * @optional
   */
  authorizationUrl?: string;

  /**
   * OAuth2 token URL
   * Only applicable for OAuth2 authentication type
   * @example 'https://auth.example.com/oauth/token'
   * @optional
   */
  tokenUrl?: string;

  /**
   * OAuth2 scopes
   * Maps scope identifiers to human-readable descriptions
   * Only applicable for OAuth2 authentication type
   * @example { 'read:users': 'Read user information', 'write:users': 'Modify user information' }
   * @optional
   */
  scopes?: Record<string, string>;
}
