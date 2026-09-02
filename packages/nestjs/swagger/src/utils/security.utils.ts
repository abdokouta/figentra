/**
 * Security Utilities for Swagger Documentation
 *
 * Provides utility functions for securing Swagger documentation endpoints
 * in production environments. These utilities help implement authentication
 * and authorization for the API documentation.
 *
 * @module SecurityUtils
 */

/**
 * Validate Swagger Configuration
 *
 * Validates that the Swagger configuration is complete and secure.
 * Logs warnings for potential security issues.
 *
 * @param config - Swagger configuration object
 * @param nodeEnv - Current Node environment
 *
 * @example
 * ```typescript
 * validateSwaggerConfig(swaggerConfig, process.env.NODE_ENV);
 * ```
 */
export function validateSwaggerConfig(
  config: { enabled: boolean; apiPath?: string; serverUrl?: string },
  nodeEnv?: string,
): void {
  const env = (nodeEnv || "development").toLowerCase();

  // Warn if Swagger is enabled in production
  if (config.enabled && env === "production") {
    console.warn(
      "⚠️  WARNING: Swagger documentation is enabled in production!",
    );
    console.warn("   Consider disabling it or adding authentication.");
  }

  // Warn if using default path
  if (config.apiPath === "api/docs" && env === "production") {
    console.warn("⚠️  WARNING: Using default Swagger path in production.");
    console.warn(
      "   Consider using a non-obvious path or adding authentication.",
    );
  }

  // Warn if serverUrl is localhost in production
  if (
    config.serverUrl?.includes("localhost") &&
    env === "production" &&
    config.enabled
  ) {
    console.warn(
      "⚠️  WARNING: Swagger server URL points to localhost in production!",
    );
    console.warn(`   Update serverUrl to your production API URL.`);
  }
}
