/**
 * Swagger Server Configuration
 *
 * Defines available API server URLs for the "Servers" dropdown in Swagger UI.
 * Allows testing against different environments (dev, staging, production).
 *
 * @interface SwaggerServer
 * @author Nesvel
 * @since 1.0.0
 */
export interface SwaggerServer {
  /**
   * Base URL of the API server
   * @example 'https://api.example.com', 'http://localhost:3000'
   */
  url: string;

  /**
   * Human-readable description of the server
   * @example 'Production Server', 'Staging Environment'
   */
  description: string;
}
