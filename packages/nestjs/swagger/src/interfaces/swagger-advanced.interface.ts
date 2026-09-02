/**
 * Swagger Advanced Configuration
 *
 * Advanced configuration options for Swagger document generation.
 *
 * @interface SwaggerAdvanced
 * @author Nesvel
 * @since 1.0.0
 */
export interface SwaggerAdvanced {
  /**
   * Function to generate operation IDs
   * @param controllerKey - Controller class name
   * @param methodKey - Method/handler name
   * @returns Generated operation ID
   */
  operationIdFactory: (controllerKey: string, methodKey: string) => string;

  /**
   * Scan all routes including dynamic modules
   * @default true
   */
  deepScanRoutes: boolean;

  /**
   * Ignore global API prefix in documentation
   * @env SWAGGER_IGNORE_GLOBAL_PREFIX
   * @default false
   */
  ignoreGlobalPrefix: boolean;

  /**
   * Specific modules to include in documentation
   * Empty array includes all modules
   * @default []
   */
  include: unknown[];

  /**
   * Additional models to include in schemas
   * Useful for shared DTOs not directly referenced
   * @default []
   */
  extraModels: unknown[];
}
