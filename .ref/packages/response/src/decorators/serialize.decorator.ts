/**
 * @file serialize.decorator.ts
 * @module @stackra/nestjs-response/decorators
 * @description Decorator to specify the output DTO class for response serialization.
 *   Instructs the response interceptor to map the response data through
 *   the specified DTO class before envelope wrapping.
 */

import { SetMetadata } from '@nestjs/common';

/** Metadata key for the serialization DTO class. */
const SERIALIZE_KEY = 'response:serialize';

/**
 * Specify the output DTO class for response serialization.
 *
 * When applied, the response interceptor will transform the controller's
 * return value through the specified DTO class using class-transformer's
 * `plainToInstance` before wrapping in the response envelope.
 *
 * @param dtoClass - The DTO class to serialize the response through
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * @Serialize(UserResponseDto)
 * @Get(':id')
 * async findOne(@Param('id') id: string) {
 *   return this.userService.findById(id); // Will be mapped to UserResponseDto
 * }
 * ```
 */
export function Serialize(dtoClass: Function): MethodDecorator {
  return SetMetadata(SERIALIZE_KEY, dtoClass);
}
