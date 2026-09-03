/**
 * @file configuration.decorator.ts
 * @module @stackra/config/nestjs/decorators
 * @description Class decorator marking a provider for auto-discovery by ConfigurationLoader.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Metadata
// ════════════════════════════════════════════════════════════════════════════════

/** Metadata key for @Configuration() decorated classes. */
export const CONFIGURATION_METADATA_KEY = 'stackra:config:configuration';

// ════════════════════════════════════════════════════════════════════════════════
// Decorator
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Mark a class for auto-discovery by the ConfigurationLoader.
 *
 * Classes decorated with `@Configuration()` have their `@Value()` properties
 * automatically populated from the config system during `onModuleInit`.
 *
 * @returns A class decorator
 *
 * @example
 * ```typescript
 * @Configuration()
 * @Injectable()
 * export class DatabaseConfig {
 *   @Value('database.host', { default: 'localhost' })
 *   host!: string;
 *
 *   @Value('database.port', { default: 5432, parse: Number })
 *   port!: number;
 * }
 * ```
 */
export function Configuration(): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(CONFIGURATION_METADATA_KEY, true, target);
  };
}
