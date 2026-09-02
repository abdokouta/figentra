/**
 * Swagger UI Configuration Options
 *
 * Configuration options for customizing the Swagger UI appearance and behavior.
 *
 * @interface SwaggerUIConfig
 * @author Nesvel
 * @since 1.0.0
 */
export interface SwaggerUIConfig {
  /**
   * Persist authorization data in browser localStorage
   * @env SWAGGER_PERSIST_AUTH
   * @default true (development), false (production)
   */
  persistAuthorization: boolean;

  /**
   * Default expansion state for operations
   * @env SWAGGER_DOC_EXPANSION
   * @default 'none'
   * @options 'none' | 'list' | 'full'
   */
  docExpansion: string;

  /**
   * Enable filtering of tags and operations
   * @env SWAGGER_FILTER
   * @default true
   */
  filter: boolean;

  /**
   * Show request duration in response
   * @env SWAGGER_SHOW_REQUEST_DURATION
   * @default true
   */
  showRequestDuration: boolean;

  /**
   * Syntax highlighting theme
   * @env SWAGGER_SYNTAX_THEME
   * @default 'monokai'
   * @options 'agate', 'arta', 'monokai', 'nord', etc.
   */
  syntaxTheme: string;

  /**
   * Enable "Try it out" by default
   * @env SWAGGER_TRY_IT_OUT
   * @default true
   */
  tryItOutEnabled: boolean;

  /**
   * Display operation IDs
   * @env SWAGGER_DISPLAY_OPERATION_ID
   * @default false
   */
  displayOperationId: boolean;

  /**
   * Display request duration
   * @env SWAGGER_DISPLAY_REQUEST_DURATION
   * @default true
   */
  displayRequestDuration: boolean;

  /**
   * Enable deep linking (URL updates with tag/operation)
   * @env SWAGGER_DEEP_LINKING
   * @default true
   */
  deepLinking: boolean;

  /**
   * Show vendor extensions (x- fields)
   * @env SWAGGER_SHOW_EXTENSIONS
   * @default false
   */
  showExtensions: boolean;

  /**
   * Show common vendor extensions
   * @env SWAGGER_SHOW_COMMON_EXTENSIONS
   * @default false
   */
  showCommonExtensions: boolean;
}
