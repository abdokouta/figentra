/**
 * @file index.ts
 * @module @stackra/testing/core/factories
 * @description Public API barrel for the fixture-factory category.
 */

export { defineFactory } from "./define-factory";
export { Rng } from "./rng";
export { Sequence } from "./sequence";
export type {
  FactoryAttributes,
  FactoryState,
  IFactory,
  IFactoryConfig,
} from "./factory.interface";
