/**
 * @file xml.renderer.ts
 * @module @stackra/nestjs-response/http/renderers
 * @description XML content renderer.
 *   Serializes response envelopes to XML format for clients that prefer XML output.
 */

import { IInjectable } from '@nestjs/common';
import type { IResponseEnvelope } from '../../interfaces/response-envelope.interface';
import type { IRendererResult } from '../../interfaces/renderer-result.interface';
import type { IRenderer } from './renderer.interface';

/**
 * XML content renderer.
 *
 * Serializes response envelopes to XML format. Handles nested objects
 * and arrays with appropriate XML element naming.
 */
@IInjectable()
export class XmlRenderer implements IRenderer {
  /** The MIME content type produced by this renderer. */
  public readonly contentType: string = 'application/xml';

  /**
   * Render the response envelope as XML.
   *
   * @param payload - The response envelope to serialize
   * @returns The XML-serialized result
   */
  public render(payload: IResponseEnvelope): IRendererResult {
    const xml = this.toXml('response', payload);
    const body = `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;

    return {
      body,
      contentType: this.contentType,
      headers: { 'Content-Type': `${this.contentType}; charset=utf-8` },
    };
  }

  /**
   * Check if this renderer supports the given Accept header.
   *
   * @param accept - The Accept header value
   * @returns Whether XML rendering is supported for this accept value
   */
  public supports(accept: string): boolean {
    return accept.includes('application/xml') || accept.includes('text/xml');
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  /**
   * Convert a value to an XML string with the given element name.
   *
   * @param name - The XML element name
   * @param value - The value to serialize
   * @returns The XML string representation
   */
  private toXml(name: string, value: unknown): string {
    if (value === null || value === undefined) {
      return `<${name} />`;
    }

    if (Array.isArray(value)) {
      const items = value.map((item) => this.toXml('item', item)).join('');
      return `<${name}>${items}</${name}>`;
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>)
        .map(([key, val]) => this.toXml(key, val))
        .join('');
      return `<${name}>${entries}</${name}>`;
    }

    return `<${name}>${this.escapeXml(String(value))}</${name}>`;
  }

  /**
   * Escape special XML characters in a string.
   *
   * @param str - The string to escape
   * @returns The XML-safe string
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
