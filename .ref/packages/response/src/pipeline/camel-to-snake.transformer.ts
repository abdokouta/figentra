/**
 * @file camel-to-snake.transformer.ts
 * @module @stackra/nestjs-response/core/pipeline
 * @description Transformer that converts camelCase keys to snake_case in response data.
 *   Useful for APIs that follow snake_case conventions in their JSON output.
 */

import type { IResponseEnvelope } from '../interfaces/response-envelope.interface';
import type { IResponseTransformer } from './transformer.interface';

/**
 * Converts camelCase object keys to snake_case in the response data.
 *
 * Recursively traverses the data payload and transforms all object keys
 * from camelCase to snake_case format. Array items are processed individually.
 */
export class CamelToSnakeTransformer implements IResponseTransformer {
  /**
   * Transform the envelope by converting data keys to snake_case.
   *
   * @param envelope - The response envelope to transform
   * @returns The envelope with snake_case keys in data
   */
  public transform(envelope: IResponseEnvelope): IResponseEnvelope {
    return {
      ...envelope,
      data: this.convertKeys(envelope.data),
    };
  }

  /**
   * Recursively convert object keys from camelCase to snake_case.
   *
   * @param value - The value to process
   * @returns The value with converted keys
   */
  private convertKeys(value: unknown): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.convertKeys(item));
    }

    if (typeof value === 'object' && value !== null) {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        result[this.toSnakeCase(key)] = this.convertKeys(val);
      }
      return result;
    }

    return value;
  }

  /**
   * Convert a camelCase string to snake_case.
   *
   * @param str - The camelCase string to convert
   * @returns The snake_case equivalent
   */
  private toSnakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }
}
