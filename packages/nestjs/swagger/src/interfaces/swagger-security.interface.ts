import type { SwaggerSecurityScheme } from "./swagger-security-scheme.interface";

/**
 * Swagger Security Configuration
 *
 * Defines available authentication methods for the API.
 *
 * @interface SwaggerSecurity
 * @author Nesvel
 * @since 1.0.0
 */
export interface SwaggerSecurity {
  /**
   * JWT Bearer authentication configuration
   */
  jwt: SwaggerSecurityScheme;

  /**
   * API Key authentication configuration
   */
  apiKey: SwaggerSecurityScheme;

  /**
   * OAuth2 authentication configuration
   */
  oauth2: SwaggerSecurityScheme;
}
