/**
 * @file index.ts
 * @module @stackra/nestjs-response/core/pipeline
 * @description Barrel export for the response transformation pipeline.
 */
export { ResponsePipeline } from './response-pipeline.service';
export type { IResponseTransformer } from './transformer.interface';
export { StripNullsTransformer } from './strip-nulls.transformer';
export { CamelToSnakeTransformer } from './camel-to-snake.transformer';
