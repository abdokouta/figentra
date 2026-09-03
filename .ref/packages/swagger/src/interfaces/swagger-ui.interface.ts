/**
 * @file swagger-ui.interface.ts
 * @module @stackra/nestjs-swagger/interfaces
 * @description Interface for Swagger UI behavior options.
 */

/**
 * Swagger UI behavior and display options.
 */
export interface ISwaggerUIOptions {
  /** Persist authorization data in browser local storage. */
  persistAuthorization?: boolean;
  /** Default expansion state: 'none' | 'list' | 'full'. */
  docExpansion?: 'none' | 'list' | 'full';
  /** Enable operation filter/search box. */
  filter?: boolean;
  /** Show request duration in ms after "Try it out". */
  showRequestDuration?: boolean;
  /** Syntax highlighting theme (e.g., 'monokai'). */
  syntaxTheme?: string;
  /** Auto-enable "Try it out" for all operations. */
  tryItOutEnabled?: boolean;
  /** Display operation ID in the UI. */
  displayOperationId?: boolean;
  /** Enable deep linking (URL hash navigation). */
  deepLinking?: boolean;
}
