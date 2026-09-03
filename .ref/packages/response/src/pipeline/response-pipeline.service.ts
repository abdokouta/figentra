/**
 * @file response-pipeline.service.ts
 * @module @stackra/nestjs-response/core/pipeline
 * @description Service for applying a sequence of transformers to a response envelope.
 *   Orchestrates the transformation pipeline in order.
 */

import { IInjectable } from '@nestjs/common';
import type { IResponseEnvelope } from '../interfaces/response-envelope.interface';
import type { IResponseTransformer } from './transformer.interface';

/**
 * Applies a sequence of transformers to a response envelope.
 *
 * Executes each transformer in order, passing the output of one
 * as the input to the next. Used by the response interceptor to
 * apply preset-defined and route-specific transformations.
 */
@IInjectable()
export class ResponsePipeline {
  /**
   * Apply transformers to a response envelope in sequence.
   *
   * @param envelope - The initial response envelope
   * @param transformers - Array of transformers to apply in order
   * @returns The transformed response envelope
   */
  public transform(
    envelope: IResponseEnvelope,
    transformers: IResponseTransformer[]
  ): IResponseEnvelope {
    let result = envelope;

    for (const transformer of transformers) {
      result = transformer.transform(result);
    }

    return result;
  }
}
