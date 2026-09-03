/**
 * @file swagger-server.interface.ts
 * @module @stackra/nestjs-swagger/interfaces
 * @description Interface for OpenAPI server definitions.
 */

/**
 * Server URL configuration for Swagger UI "Try it out" functionality.
 */
export interface ISwaggerServer {
  /** Full base URL (e.g., 'https://api.example.com/v1'). */
  url: string;
  /** Human-readable description (e.g., 'Production', 'Staging'). */
  description: string;
}
