/**
 * @file renderer-result.interface.ts
 * @module @stackra/nestjs-response/interfaces
 * @description Result interface returned by content renderers.
 *   Encapsulates the serialized body, content type, and optional headers.
 */

/**
 * Result produced by a content renderer.
 *
 * Contains the serialized response body, the appropriate content-type
 * header value, and any additional headers the renderer needs to set.
 */
export interface IRendererResult {
  /** Serialized response body (string for text formats, Buffer for binary). */
  body: string | Buffer;
  /** MIME content type for the response (e.g., 'application/json'). */
  contentType: string;
  /** Additional HTTP headers to include in the response. */
  headers?: Record<string, string>;
}
