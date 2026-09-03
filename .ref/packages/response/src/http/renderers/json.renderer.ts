/**
 * @file json.renderer.ts
 * @module @stackra/nestjs-response/http/renderers
 * @description Default JSON content renderer.
 *   Serializes response envelopes to JSON format with proper content type.
 */

import { IInjectable } from '@nestjs/common';
import type { IResponseEnvelope } from '../../interfaces/response-envelope.interface';
import type { IRendererResult } from '../../interfaces/renderer-result.interface';
import type { IRenderer } from './renderer.interface';

/**
 * Default JSON content renderer.
 *
 * Serializes response envelopes to JSON format. This is the default
 * renderer used when no specific format is requested or when the
 * Accept header includes `application/json`.
 */
@IInjectable()
export class JsonRenderer implements IRenderer {
  /** The MIME content type produced by this renderer. */
  public readonly contentType: string = 'application/json';

  /**
   * Render the response envelope as JSON.
   *
   * @param payload - The response envelope to serialize
   * @returns The JSON-serialized result
   */
  public render(payload: IResponseEnvelope): IRendererResult {
    return {
      body: JSON.stringify(payload),
      contentType: this.contentType,
      headers: { 'Content-Type': `${this.contentType}; charset=utf-8` },
    };
  }

  /**
   * Check if this renderer supports the given Accept header.
   *
   * @param accept - The Accept header value
   * @returns Whether JSON rendering is supported for this accept value
   */
  public supports(accept: string): boolean {
    return accept.includes('application/json') || accept.includes('*/*') || accept === '';
  }
}
