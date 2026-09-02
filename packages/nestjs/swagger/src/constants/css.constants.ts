/**
 * Default Custom CSS for Swagger UI
 *
 * Custom CSS styles to enhance the appearance and usability of the Swagger UI.
 * These styles provide a cleaner, more professional look by:
 * - Hiding the default Swagger topbar
 * - Adding proper spacing to the info section
 * - Styling the server/scheme selector container
 *
 * @constant DEFAULT_SWAGGER_CSS
 *
 * @example
 * ```typescript
 * import { DEFAULT_SWAGGER_CSS } from './constants';
 *
 * SwaggerModule.setup('api/docs', app, document, {
 *   customCss: DEFAULT_SWAGGER_CSS
 * });
 * ```
 *
 * @remarks
 * These styles can be extended or overridden by providing your own CSS string.
 * All styles are scoped to `.swagger-ui` to avoid conflicts with other page styles.
 */
export const DEFAULT_SWAGGER_CSS = `
  /**
   * Hide the default Swagger UI topbar
   * The topbar contains Swagger branding and is not needed in custom implementations
   */
  .swagger-ui .topbar { display: none }

  /**
   * Add vertical spacing to the API info section
   * Improves readability of the API title, description, and metadata
   */
  .swagger-ui .info { margin: 20px 0; }

  /**
   * Style the server/scheme selection container
   * Provides visual separation and better organization for the server selector
   */
  .swagger-ui .scheme-container { margin: 20px 0; padding: 20px; background: #fafafa; }
`;
