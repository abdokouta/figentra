/**
 * Swagger License Information
 *
 * Specifies the license under which the API is provided.
 * Displayed in the API information section of Swagger UI.
 *
 * @interface SwaggerLicense
 * @author Nesvel
 * @since 1.0.0
 */
export interface SwaggerLicense {
  /**
   * License name
   * @example 'MIT', 'Apache 2.0', 'Proprietary'
   */
  name: string;

  /**
   * URL to the full license text
   * @example 'https://opensource.org/licenses/MIT'
   */
  url: string;
}
