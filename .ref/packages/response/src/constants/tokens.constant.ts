/**
 * @file tokens.constant.ts
 * @module @stackra/nestjs-response/constants
 * @description DI tokens and default configuration for the response module.
 *   Provides injection tokens for the response config and renderer registry,
 *   plus sensible default values for all configuration options.
 */

import type { IResponseModuleConfig } from '../interfaces';

// ============================================================================
// DI Tokens
// ============================================================================

/**
 * DI token for the resolved response module configuration.
 *
 * Injected by `ResponseModule.forRoot()`. Consumers use
 * `@Inject(RESPONSE_CONFIG)` to access the merged configuration.
 */
export const RESPONSE_CONFIG: symbol = Symbol.for('RESPONSE_CONFIG');

/**
 * DI token for the renderer registry service.
 *
 * Resolves the appropriate content renderer based on the Accept header.
 */
export const RENDERER_REGISTRY: symbol = Symbol.for('RENDERER_REGISTRY');

// ============================================================================
// Defaults
// ============================================================================

/**
 * Default configuration values for the response module.
 *
 * Applied when no explicit configuration is provided to `ResponseModule.forRoot()`.
 * All envelope features are enabled by default for maximum observability.
 */
export const RESPONSE_DEFAULTS: IResponseModuleConfig = {
  envelope: {
    enabled: true,
    includeTimestamp: true,
    includeRequestId: true,
  },
  debug: {
    enabled: false,
    includeStack: false,
    includeSql: false,
  },
  defaultPreset: 'api',
  defaultRenderer: 'json',
  maxPageSize: 100,
};
