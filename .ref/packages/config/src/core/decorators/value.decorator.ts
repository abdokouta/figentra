/**
 * @file value.decorator.ts
 * @module @stackra/config/core/decorators
 * @description Property decorator that maps a configuration key to a class property.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════════
// Internal Storage
// ════════════════════════════════════════════════════════════════════════════════

/** Storage for @Value() metadata per class prototype. */
const valuePropertiesMap = new WeakMap<object, (string | symbol)[]>();

/** Storage for per-property @Value() metadata. */
const valueMetadataMap = new WeakMap<object, Map<string | symbol, IValueMetadata>>();

// ════════════════════════════════════════════════════════════════════════════════
// Decorator
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Maps a configuration key to a class property.
 *
 * The value is resolved from the ConfigModule's default source
 * at bootstrap time. If the key is not found, the `default` value
 * is used. If `parse` is provided, the raw value is transformed.
 *
 * @param key - The configuration key (e.g., 'APP_NAME', 'API_TIMEOUT')
 * @param options - Value options (default, parse, required, sensitive)
 * @returns A property decorator
 *
 * @example
 * ```typescript
 * class AppSettings {
 *   @Value('APP_NAME', { default: 'MyApp' })
 *   appName!: string;
 *
 *   @Value('API_TIMEOUT', { default: 10000, parse: Number })
 *   apiTimeout!: number;
 *
 *   @Value('DEBUG', { default: false, parse: (v) => v === 'true' })
 *   debug!: boolean;
 * }
 * ```
 */
export function Value(key: string, options: IValueOptions = {}): PropertyDecorator {
  return (target: object, property: string | symbol) => {
    const metadata: IValueMetadata = { key, property, options };

    // Store property metadata
    if (!valueMetadataMap.has(target)) {
      valueMetadataMap.set(target, new Map());
    }
    valueMetadataMap.get(target)!.set(property, metadata);

    // Track which properties have @Value() on this class
    const existing = valuePropertiesMap.get(target) ?? [];
    valuePropertiesMap.set(target, [...existing, property]);
  };
}

/**
 * Get all `@Value()` decorated property names from a class prototype.
 *
 * @param target - The class prototype
 * @returns Array of property names with @Value() decoration
 */
export function getValueProperties(target: object): (string | symbol)[] {
  return valuePropertiesMap.get(target) ?? [];
}

/**
 * Get the `@Value()` metadata for a specific property.
 *
 * @param target - The class prototype
 * @param property - The property name
 * @returns The ValueMetadata, or undefined if not decorated
 */
export function getValueMetadata(
  target: object,
  property: string | symbol
): IValueMetadata | undefined {
  return valueMetadataMap.get(target)?.get(property);
}
