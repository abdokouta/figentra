/**
 * @file dynamic-module.interface.ts
 * @module @stackra/contracts/primitives
 * @description The return type of every `<Pkg>Module.forRoot()` and
 *   `<Pkg>Module.forFeature()` static method. Defines the providers, imports,
 *   and exports a dynamically-composed module contributes to the DI graph.
 */

import type { Provider } from "./provider.interface";
import type { Type } from "./type.type";

/**
 * A dynamically-composed module descriptor returned by `forRoot()` /
 * `forFeature()` static methods. The container merges it into the module
 * graph at bootstrap time.
 *
 * @example
 * ```ts
 * import type { DynamicModule } from "@stackra/contracts";
 *
 * static forRoot(options?: IFooOptions): DynamicModule {
 *   return {
 *     module: FooModule,
 *     global: true,
 *     providers: [FooService, { provide: FOO_CONFIG, useValue: options }],
 *     exports: [FooService, FOO_CONFIG],
 *   };
 * }
 * ```
 */
export interface DynamicModule {
  /** The module class this descriptor belongs to. */
  readonly module: Type;

  /** When `true`, every provider in this module is visible to the entire app. */
  readonly global?: boolean;

  /** Other modules this module composes (their exports become available here). */
  readonly imports?: Array<Type | DynamicModule>;

  /** Providers this module registers in the DI graph. */
  readonly providers?: Provider[];

  /** Providers + tokens this module makes available to importing modules. */
  readonly exports?: Array<symbol | string | Type | Provider>;
}
