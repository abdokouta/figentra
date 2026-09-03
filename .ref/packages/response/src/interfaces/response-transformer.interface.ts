/**
 * @file response-transformer.interface.ts
 * @module @stackra/response/src/interfaces
 * @description IResponseTransformer interface.
 */

/**
 * Contract for response envelope transformers.
 *
 * Transformers are applied in sequence to modify the response envelope
 * before serialization. Common uses include stripping null values,
 * converting key casing, and adding computed fields.
 */
export interface IResponseTransformer {
  /**
   * Transform the response envelope.
   *
   * @param envelope - The current response envelope
   * @returns The transformed response envelope
   */
  transform(envelope: IResponseEnvelope): IResponseEnvelope;
}
