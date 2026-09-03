/**
 * @file value-options.interface.ts
 * @module @stackra/config/src/interfaces
 * @description IValueOptions interface.
 */

/**
 * Options for the `@Value()` decorator.
 */
export interface IValueOptions {
  /** Default value if the config key is not found. */
  default?: unknown;

  /** Parse/transform function to coerce the raw string value. */
  parse?: (value: unknown) => unknown;

  /** Whether this value is required (throws if missing and no default). */
  required?: boolean;

  /** Mark this value as sensitive (redacted in safe output). */
  sensitive?: boolean;
}
