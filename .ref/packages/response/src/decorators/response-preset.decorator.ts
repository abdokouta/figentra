/**
 * @file response-preset.decorator.ts
 * @module @stackra/nestjs-response/decorators
 * @description Decorator to apply a response preset to a controller or method.
 *   Presets configure renderer, debug output, links, meta, headers, and transformers.
 */

import { SetMetadata } from '@nestjs/common';
import type { IResponsePreset } from '../presets';

/** Metadata key for the response preset. */
const USE_PRESET_KEY = 'response:use_preset';

/**
 * Apply a response preset to a controller or method.
 *
 * The preset configures how the response is rendered, what metadata
 * is included, and which transformers are applied. Presets defined
 * on methods override those on the controller class.
 *
 * @param preset - The response preset configuration to apply
 * @returns Class or method decorator
 *
 * @example
 * ```typescript
 * @ResponsePreset(ADMIN_PRESET)
 * @Controller('admin/users')
 * export class AdminUserController { ... }
 * ```
 */
export function ResponsePreset(preset: IResponsePreset): ClassDecorator & MethodDecorator {
  return SetMetadata(USE_PRESET_KEY, preset);
}
