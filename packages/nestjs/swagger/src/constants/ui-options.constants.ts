/**
 * Default Swagger UI Options
 *
 * These are the default configuration options for the Swagger UI interface.
 * They provide a balance between usability and security for development environments.
 *
 * @constant DEFAULT_SWAGGER_UI_OPTIONS
 *
 * @property {boolean} persistAuthorization - Keeps authorization data in browser storage
 * @property {string} docExpansion - Controls initial expansion state of operations ('none' = collapsed)
 * @property {boolean} filter - Enables the filter/search box for operations
 * @property {boolean} showRequestDuration - Shows API request completion time
 * @property {Object} syntaxHighlight - Syntax highlighting configuration
 * @property {string} syntaxHighlight.theme - Color theme for code blocks
 * @property {boolean} tryItOutEnabled - Auto-enables "Try it out" feature
 *
 * @example
 * ```typescript
 * import { DEFAULT_SWAGGER_UI_OPTIONS } from './constants';
 *
 * SwaggerModule.setup('api/docs', app, document, {
 *   swaggerOptions: DEFAULT_SWAGGER_UI_OPTIONS
 * });
 * ```
 */
export const DEFAULT_SWAGGER_UI_OPTIONS = {
  /**
   * Persist authorization data in browser's local storage
   * Allows users to remain authenticated across page reloads
   */
  persistAuthorization: true,

  /**
   * Default expansion state for operations
   * 'none' keeps all operations collapsed for a cleaner initial view
   */
  docExpansion: "none" as const,

  /**
   * Enable filtering/searching of operations
   * Helps users quickly find specific endpoints
   */
  filter: true,

  /**
   * Display request duration in milliseconds
   * Useful for identifying slow endpoints during development
   */
  showRequestDuration: true,

  /**
   * Syntax highlighting configuration
   * Uses 'monokai' theme for better code readability
   */
  syntaxHighlight: {
    theme: "monokai",
  },

  /**
   * Enable "Try it out" by default
   * Allows immediate testing of endpoints without additional clicks
   */
  tryItOutEnabled: true,
};
