/**
 * @file value-metadata.interface.ts
 * @module @stackra/config/src/interfaces
 * @description IValueMetadata interface.
 */

/**
 * Stored metadata for a single `@Value()` decorated property.
 */
export interface IValueMetadata {
  /** The configuration key to read from. */
  key: string;

  /** The property name on the class. */
  property: string | symbol;

  /** Decorator options. */
  options: IValueOptions;
}
