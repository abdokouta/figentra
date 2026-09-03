/**
 * @file response-config.interface.ts
 * @module @stackra/nestjs-response/interfaces
 * @description Configuration interface for the response module.
 *   Defines all options available when calling `ResponseModule.forRoot()`.
 */

/**
 * Configuration options for the response module.
 *
 * Controls envelope wrapping behavior, debug output, default presets,
 * renderer selection, and pagination limits.
 */
export interface IResponseModuleConfig {
  /** Envelope wrapping configuration. */
  envelope?: {
    /** Whether to wrap all responses in the standard envelope. */
    enabled?: boolean;
    /** Whether to include an ISO timestamp in every response. */
    includeTimestamp?: boolean;
    /** Whether to include the request ID in every response. */
    includeRequestId?: boolean;
  };
  /** Debug output configuration. */
  debug?: {
    /** Whether debug mode is enabled globally. */
    enabled?: boolean;
    /** Whether to include stack traces in error responses. */
    includeStack?: boolean;
    /** Whether to include SQL query information in responses. */
    includeSql?: boolean;
  };
  /** Name of the default response preset to apply. */
  defaultPreset?: string;
  /** Name of the default renderer (json, xml, csv). */
  defaultRenderer?: string;
  /** Maximum allowed page size for paginated responses. */
  maxPageSize?: number;
}
