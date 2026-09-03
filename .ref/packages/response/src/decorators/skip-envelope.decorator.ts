/**
 * @file skip-envelope.decorator.ts
 * @module @stackra/nestjs-response/decorators
 * @description Decorator to bypass the response envelope wrapping.
 *   When applied to a controller or method, the response interceptor
 *   will pass the raw return value through without wrapping.
 */

import { SetMetadata } from '@nestjs/common';

/** Metadata key for skipping envelope wrapping. */
const SKIP_ENVELOPE_KEY = 'response:skip_envelope';

/**
 * Skip the standard response envelope wrapping for a controller or method.
 *
 * When applied, the `ResponseInterceptor` will pass the controller's
 * return value directly to the client without wrapping it in the
 * standard `IResponseEnvelope` shape.
 *
 * @returns Class or method decorator
 *
 * @example
 * ```typescript
 * @SkipEnvelope()
 * @Get('health')
 * async healthCheck() {
 *   return { status: 'ok' }; // Returned as-is, no envelope
 * }
 * ```
 */
export function SkipEnvelope(): ClassDecorator & MethodDecorator {
  return SetMetadata(SKIP_ENVELOPE_KEY, true);
}
