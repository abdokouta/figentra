/**
 * @file inject-config.decorator.ts
 * @module @stackra/config/core/decorators
 * @description Decorator to inject a ConfigService for a specific source.
 */

import { Inject } from '@stackra/ts-container';
import { CONFIG_SERVICE } from '@stackra/contracts';

// ════════════════════════════════════════════════════════════════════════════════
// Helper
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Generate a DI token for a named config source.
 *
 * @param name - Source name (omit for default source token)
 * @returns A symbol token for the source
 */
function getConfigSourceToken(name?: string): symbol {
  return Symbol.for(`ConfigSource:${name ?? 'default'}`);
}

// ════════════════════════════════════════════════════════════════════════════════
// Decorator
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Inject a ConfigService for a specific source (or the default source).
 *
 * When called without arguments, injects the default source's ConfigService
 * (equivalent to `@Inject(CONFIG_SERVICE)`).
 *
 * When called with a source name, injects the ConfigService for that
 * specific named source (equivalent to `@Inject(getConfigSourceToken(name))`).
 *
 * @param sourceName - Optional source name. Uses default if omitted.
 * @returns A parameter/property decorator
 *
 * @example
 * ```typescript
 * @Injectable()
 * class DatabaseService {
 *   constructor(
 *     // Inject the default source's ConfigService
 *     @InjectConfig() private config: ConfigService,
 *     // Inject a specific named source
 *     @InjectConfig('database') private dbConfig: ConfigService,
 *   ) {}
 *
 *   connect() {
 *     const host = this.dbConfig.getString('host', 'localhost');
 *   }
 * }
 * ```
 */
export function InjectConfig(sourceName?: string): PropertyDecorator & ParameterDecorator {
  if (!sourceName) {
    return Inject(CONFIG_SERVICE);
  }
  return Inject(getConfigSourceToken(sourceName));
}
