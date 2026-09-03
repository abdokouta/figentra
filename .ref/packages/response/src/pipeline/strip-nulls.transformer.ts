/**
 * @file strip-nulls.transformer.ts
 * @module @stackra/nestjs-response/core/pipeline
 * @description Transformer that removes null and undefined values from response data.
 *   Produces cleaner JSON output by stripping empty fields recursively.
 */

import type { IResponseEnvelope } from '../interfaces/response-envelope.interface';
import type { IResponseTransformer } from './transformer.interface';

/**
 * Strips null and undefined values from the response data payload.
 *
 * Recursively traverses the data object and removes any keys whose
 * values are null or undefined, producing a more compact response.
 */
export class StripNullsTransformer implements IResponseTransformer {
  /**
   * Transform the envelope by stripping null values from data.
   *
   * @param envelope - The response envelope to transform
   * @returns The envelope with null values removed from data
   */
  public transform(envelope: IResponseEnvelope): IResponseEnvelope {
    return {
      ...envelope,
      data: this.stripNulls(envelope.data),
    };
  }

  /**
   * Recursively strip null and undefined values from an object.
   *
   * @param value - The value to process
   * @returns The cleaned value with nulls removed
   */
  private stripNulls(value: unknown): unknown {
    if (value === null || value === undefined) {
      return undefined;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.stripNulls(item)).filter((item) => item !== undefined);
    }

    if (typeof value === 'object' && value !== null) {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        const stripped = this.stripNulls(val);
        if (stripped !== undefined) {
          result[key] = stripped;
        }
      }
      return result;
    }

    return value;
  }
}
