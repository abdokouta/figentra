/**
 * @file renderer-resolver.service.ts
 * @module @stackra/nestjs-response/http/renderers
 * @description Service that resolves the appropriate content renderer
 *   based on the request's Accept header. Falls back to JSON when no
 *   specific renderer matches.
 */

import { IInjectable } from '@nestjs/common';
import type { IRenderer } from './renderer.interface';
import { JsonRenderer } from './json.renderer';
import { XmlRenderer } from './xml.renderer';
import { CsvRenderer } from './csv.renderer';

/**
 * Resolves the appropriate content renderer from the Accept header.
 *
 * Maintains a registry of available renderers and selects the best match
 * based on content negotiation. Falls back to JSON when no specific
 * renderer matches the requested format.
 */
@IInjectable()
export class RendererResolver {
  /** Registered renderers in priority order. */
  private readonly renderers: IRenderer[];

  /** Default JSON renderer for fallback. */
  private readonly defaultRenderer: JsonRenderer;

  /**
   * @param jsonRenderer - JSON renderer (default fallback)
   * @param xmlRenderer - XML renderer
   * @param csvRenderer - CSV renderer
   */
  public constructor(
    jsonRenderer: JsonRenderer,
    xmlRenderer: XmlRenderer,
    csvRenderer: CsvRenderer
  ) {
    this.defaultRenderer = jsonRenderer;
    this.renderers = [jsonRenderer, xmlRenderer, csvRenderer];
  }

  /**
   * Resolve the appropriate renderer for the given Accept header.
   *
   * @param accept - The Accept header value from the request
   * @returns The matching renderer, or JSON renderer as fallback
   */
  public resolve(accept: string): IRenderer {
    const normalizedAccept = accept.toLowerCase().trim();

    for (const renderer of this.renderers) {
      if (renderer.supports(normalizedAccept)) {
        return renderer;
      }
    }

    // Default to JSON
    return this.defaultRenderer;
  }

  /**
   * Get all registered renderers.
   *
   * @returns Array of all available renderers
   */
  public getRenderers(): IRenderer[] {
    return [...this.renderers];
  }
}
