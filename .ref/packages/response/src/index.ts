/**
 * @file index.ts
 * @module @stackra/nestjs-response
 * @description Public API for the response formatting and envelope module.
 */

// ============================================================================
// Module
// ============================================================================
export { NestResponseModule } from './nest-response.module';

// ============================================================================
// Builder
// ============================================================================
export { ResponseBuilder } from './builder';

// ============================================================================
// Envelope
// ============================================================================
export { ResponseEnvelope, ErrorEnvelope } from './envelope';

// ============================================================================
// Context
// ============================================================================
export { ResponseContext } from './context';

// ============================================================================
// Pipeline
// ============================================================================
export { ResponsePipeline, StripNullsTransformer, CamelToSnakeTransformer } from './pipeline';

// ============================================================================
// Errors
// ============================================================================
export { ErrorFormatterService } from './errors';

// ============================================================================
// HATEOAS
// ============================================================================
export { HateoasLinkBuilder } from './hateoas';

// ============================================================================
// Presets
// ============================================================================
export { API_PRESET, ADMIN_PRESET, MOBILE_PRESET, M2M_PRESET, WEBHOOK_PRESET } from './presets';

// ============================================================================
// Decorators
// ============================================================================
export { ApiResponse } from './decorators/api-response.decorator';
export { ResponsePreset } from './decorators/response-preset.decorator';
export { Serialize } from './decorators/serialize.decorator';
export { SkipEnvelope } from './decorators/skip-envelope.decorator';

// ============================================================================
// HTTP (filters, interceptors, middleware, renderers)
// ============================================================================

// ============================================================================
// GraphQL (interceptors, plugins, types)
// ============================================================================

// ============================================================================
// Constants
// ============================================================================

// ============================================================================
// Interfaces
// ============================================================================
export type { IHateoasLink } from './hateoas';
export type { IResponseTransformer } from './pipeline';
export type { IResponsePreset } from './presets';
