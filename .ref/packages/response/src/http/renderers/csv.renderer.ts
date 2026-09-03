/**
 * @file csv.renderer.ts
 * @module @stackra/nestjs-response/http/renderers
 * @description CSV content renderer.
 *   Flattens array data from response envelopes into CSV format for
 *   spreadsheet-compatible output.
 */

import { IInjectable } from '@nestjs/common';
import type { IResponseEnvelope } from '../../interfaces/response-envelope.interface';
import type { IRendererResult } from '../../interfaces/renderer-result.interface';
import type { IRenderer } from './renderer.interface';

/**
 * CSV content renderer.
 *
 * Flattens the data array from a response envelope into CSV format.
 * Best suited for list/collection endpoints where data is an array of objects.
 * Non-array data is wrapped in a single-row CSV.
 */
@IInjectable()
export class CsvRenderer implements IRenderer {
  /** The MIME content type produced by this renderer. */
  public readonly contentType: string = 'text/csv';

  /**
   * Render the response envelope data as CSV.
   *
   * @param payload - The response envelope to serialize
   * @returns The CSV-serialized result
   */
  public render(payload: IResponseEnvelope): IRendererResult {
    const data = payload.data;
    const rows = Array.isArray(data) ? data : [data];

    if (rows.length === 0) {
      return {
        body: '',
        contentType: this.contentType,
        headers: {
          'Content-Type': `${this.contentType}; charset=utf-8`,
          'Content-Disposition': 'attachment; filename="export.csv"',
        },
      };
    }

    // Extract headers from the first row
    const headers = this.extractHeaders(rows[0]);
    const headerLine = headers.map((h) => this.escapeCsvField(h)).join(',');

    // Build data rows
    const dataLines = rows.map((row) => {
      return headers
        .map((header) => {
          const value = this.getNestedValue(row, header);
          return this.escapeCsvField(String(value ?? ''));
        })
        .join(',');
    });

    const body = [headerLine, ...dataLines].join('\n');

    return {
      body,
      contentType: this.contentType,
      headers: {
        'Content-Type': `${this.contentType}; charset=utf-8`,
        'Content-Disposition': 'attachment; filename="export.csv"',
      },
    };
  }

  /**
   * Check if this renderer supports the given Accept header.
   *
   * @param accept - The Accept header value
   * @returns Whether CSV rendering is supported for this accept value
   */
  public supports(accept: string): boolean {
    return accept.includes('text/csv') || accept.includes('application/csv');
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  /**
   * Extract column headers from a data object.
   *
   * @param obj - The object to extract keys from
   * @returns Array of column header names
   */
  private extractHeaders(obj: unknown): string[] {
    if (typeof obj !== 'object' || obj === null) {
      return ['value'];
    }
    return Object.keys(obj as Record<string, unknown>);
  }

  /**
   * Get a nested value from an object by key path.
   *
   * @param obj - The object to read from
   * @param key - The key to look up
   * @returns The value at the given key
   */
  private getNestedValue(obj: unknown, key: string): unknown {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    return (obj as Record<string, unknown>)[key];
  }

  /**
   * Escape a CSV field value (wrap in quotes if it contains special characters).
   *
   * @param field - The field value to escape
   * @returns The escaped CSV field
   */
  private escapeCsvField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
}
