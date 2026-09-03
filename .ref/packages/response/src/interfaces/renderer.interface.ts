/**
 * @file renderer.interface.ts
 * @module @stackra/response/src/interfaces
 * @description IRenderer interface.
 */

/**
 * Contract for content renderers.
 *
 * Renderers serialize a response envelope into a specific output format.
 * The renderer resolver selects the appropriate renderer based on the
 * request's Accept header.
 */
export interface IRenderer {
  /** The MIME content type this renderer produces. */
  readonly contentType: string;

  /**
   * Render a response envelope into the target format.
   *
   * @param payload - The response envelope to render
   * @returns The rendered result with body, content type, and headers
   */
  render(payload: IResponseEnvelope): IRendererResult;

  /**
   * Check if this renderer supports the given Accept header value.
   *
   * @param accept - The Accept header value from the request
   * @returns Whether this renderer can handle the requested format
   */
  supports(accept: string): boolean;
}
