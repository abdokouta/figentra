/**
 * @file key-builder-options.interface.ts
 * @module @stackra/redis/src/interfaces
 * @description IKeyBuilderOptions interface.
 */

/**
 * Options for the key builder.
 */
export interface IKeyBuilderOptions {
  /** Global prefix applied to all generated keys. */
  prefix?: string;

  /** Separator between key segments. Default: `:`. */
  separator?: string;
}
