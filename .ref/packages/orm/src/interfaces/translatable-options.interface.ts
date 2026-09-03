/**
 * @file translatable-options.interface.ts
 * @module @stackra/orm/src/interfaces
 * @description TranslatableOptions interface.
 */

/** Options for the @Translatable() decorator. */
export interface TranslatableOptions {
  /** Storage strategy. Default: 'table'. */
  strategy?: StorageStrategy;
}
