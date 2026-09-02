import { SwaggerDocExpansion } from "../enums";

/**
 * Swagger UI Options Interface
 *
 * Defines the configuration options for customizing the Swagger UI appearance and behavior.
 * These options control how the API documentation is displayed and how users interact with it.
 *
 * @interface SwaggerUIOptions
 *
 * @example
 * ```typescript
 * const uiOptions: SwaggerUIOptions = {
 *   persistAuthorization: true,
 *   docExpansion: 'none',
 *   filter: true,
 *   showRequestDuration: true,
 *   syntaxHighlight: {
 *     theme: 'monokai'
 *   },
 *   tryItOutEnabled: true
 * };
 * ```
 */
export interface SwaggerUIOptions {
  /**
   * Persist authorization data
   *
   * When enabled, authorization data (tokens, API keys) will be persisted
   * in the browser's local storage and automatically populated on page reload.
   *
   * **Security Note**: Only enable this in development environments.
   * In production, users should re-authenticate on each session.
   *
   * @optional
   * @default false
   * @example true
   */
  persistAuthorization?: boolean;

  /**
   * Controls the default expansion state of operations and tags
   *
   * Determines how the API endpoints are initially displayed:
   * - SwaggerDocExpansion.LIST: Shows only the operation names (most compact)
   * - SwaggerDocExpansion.FULL: Expands all operations and their details
   * - SwaggerDocExpansion.NONE: Collapses all operations (shows only tags)
   *
   * @optional
   * @default SwaggerDocExpansion.LIST
   * @example SwaggerDocExpansion.NONE
   */
  docExpansion?: SwaggerDocExpansion;

  /**
   * Enable filtering of operations
   *
   * When enabled, shows a filter box that allows users to filter operations by:
   * - Operation paths
   * - Operation descriptions
   * - Tags
   *
   * Can be:
   * - `true`: Enables filtering with default settings
   * - `false`: Disables filtering
   * - `string`: Enables filtering with a specific filter query
   *
   * @optional
   * @default false
   * @example true
   */
  filter?: boolean | string;

  /**
   * Show request duration in milliseconds
   *
   * When enabled, displays the time it took for each API request to complete.
   * Useful for performance monitoring and optimization.
   *
   * @optional
   * @default false
   * @example true
   */
  showRequestDuration?: boolean;

  /**
   * Syntax highlighting configuration
   *
   * Controls the syntax highlighting theme for request/response bodies.
   * Common themes include:
   * - `agate`: Dark theme with high contrast
   * - `arta`: Dark theme with warm colors
   * - `monokai`: Popular dark theme
   * - `nord`: Arctic, north-bluish color palette
   * - `obsidian`: Very dark theme
   * - `tomorrow-night`: Dark theme with pastel colors
   *
   * @optional
   * @example { theme: 'monokai' }
   */
  syntaxHighlight?: {
    /**
     * Theme name
     *
     * @example 'monokai'
     * @example 'tomorrow-night'
     */
    theme: string;
  };

  /**
   * Enable "Try it out" functionality by default
   *
   * When enabled, the "Try it out" button is automatically activated
   * for all operations, allowing users to immediately test API endpoints.
   *
   * When disabled, users must manually click "Try it out" for each operation.
   *
   * @optional
   * @default false
   * @example true
   */
  tryItOutEnabled?: boolean;
}
