/**
 * Swagger External Documentation
 *
 * Links to additional documentation outside of Swagger UI.
 * Useful for detailed guides, tutorials, or architecture documentation.
 *
 * @interface SwaggerExternalDocs
 * @author Nesvel
 * @since 1.0.0
 */
export interface SwaggerExternalDocs {
  /**
   * URL to external documentation
   * @example 'https://docs.example.com/api'
   */
  url: string;

  /**
   * Description of the external documentation
   * @example 'Complete API Documentation', 'Developer Guide'
   */
  description: string;
}
