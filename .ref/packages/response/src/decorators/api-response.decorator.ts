/**
 * @file api-response.decorator.ts
 * @module @stackra/nestjs-response/decorators
 * @description Decorator for attaching Swagger/OpenAPI response metadata
 *   to controller methods. Stores status code and response type for
 *   documentation generation.
 */

import { SetMetadata } from '@nestjs/common';

/** Metadata key for API response documentation. */
const API_RESPONSE_KEY = 'response:api_response';

/**
 * Options for the @ApiResponse decorator.
 */
interface IApiResponseOptions {
  /** HTTP status code for this response. */
  status: number;
  /** The response DTO class type for Swagger schema generation. */
  type?: Function;
  /** Description of when this response is returned. */
  description?: string;
}

/**
 * Attach Swagger/OpenAPI response metadata to a controller method.
 *
 * Used by documentation generators to describe the possible responses
 * from an endpoint, including status codes and response body types.
 *
 * @param options - Response metadata options
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * @ApiResponse({ status: 200, type: UserDto, description: 'User found' })
 * @Get(':id')
 * async findOne(@Param('id') id: string) { ... }
 * ```
 */
export function ApiResponse(options: IApiResponseOptions): MethodDecorator {
  return SetMetadata(API_RESPONSE_KEY, options);
}
