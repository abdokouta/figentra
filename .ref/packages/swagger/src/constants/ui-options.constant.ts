/**
 * @file ui-options.constant.ts
 * @module @stackra/nestjs-swagger/constants
 * @description Default Swagger UI behavior options.
 */

/**
 * Default Swagger UI options applied when no custom `ui` config is provided.
 */
export const DEFAULT_UI_OPTIONS = {
  /** Keep auth tokens across page reloads. */
  persistAuthorization: true,
  /** Collapse all operations on load. */
  docExpansion: 'none' as const,
  /** Enable operation search. */
  filter: true,
  /** Show request time after execution. */
  showRequestDuration: true,
  /** Syntax highlighting theme. */
  syntaxHighlight: { theme: 'monokai' },
  /** Auto-enable "Try it out". */
  tryItOutEnabled: true,
} as const;
