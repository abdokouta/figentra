/**
 * Swagger Document URLs
 *
 * Configuration for raw OpenAPI specification document endpoints.
 *
 * @interface SwaggerDocuments
 * @author Nesvel
 * @since 1.0.0
 */
export interface SwaggerDocuments {
  /**
   * JSON format OpenAPI document URL
   * @env SWAGGER_JSON_URL
   * @default 'api/docs-json'
   */
  jsonDocumentUrl: string;

  /**
   * YAML format OpenAPI document URL
   * @env SWAGGER_YAML_URL
   * @default 'api/docs-yaml'
   */
  yamlDocumentUrl: string;
}
