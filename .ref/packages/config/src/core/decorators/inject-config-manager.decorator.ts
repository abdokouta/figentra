/**
 * @file inject-config-manager.decorator.ts
 * @module @stackra/config/core/decorators
 * @description Decorator to inject the ConfigManager from the DI container.
 */

import { Inject } from '@stackra/ts-container';
import { CONFIG_MANAGER } from '@stackra/contracts';

// ════════════════════════════════════════════════════════════════════════════════
// Decorator
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Injects the ConfigManager from the DI container.
 *
 * Use when you need direct access to the ConfigManager for advanced
 * operations like switching sources, extending drivers, or introspection.
 *
 * For most use cases, prefer `@InjectConfig()` which gives you a
 * ConfigService directly.
 *
 * @returns A parameter/property decorator
 *
 * @example
 * ```typescript
 * @Injectable()
 * class ConfigAdmin {
 *   constructor(@InjectConfigManager() private manager: ConfigManager) {}
 *
 *   getSourceNames(): string[] {
 *     return this.manager.getSourceNames();
 *   }
 * }
 * ```
 */
export const InjectConfigManager = (): PropertyDecorator & ParameterDecorator =>
  Inject(CONFIG_MANAGER);
