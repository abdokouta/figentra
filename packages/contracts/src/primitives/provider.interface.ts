/**
 * @file provider.interface.ts
 * @module @stackra/contracts/primitives
 * @description DI provider shapes consumed by the container's module system.
 *   Every provider is either a class reference, or a descriptor that binds a
 *   token to a value / factory / class / alias.
 */

import type { Type } from "./type.type";

/**
 * A class-based provider — the container instantiates the class and resolves
 * its constructor deps via reflection.
 */
export interface IClassProvider<T = unknown> {
  /** The injection token consumers `@Inject()` against. */
  readonly provide: symbol | string | Type<T>;
  /** The concrete class the container instantiates. */
  readonly useClass: Type<T>;
}

/**
 * A value provider — the container stores the value as-is (no instantiation).
 */
export interface IValueProvider<T = unknown> {
  readonly provide: symbol | string | Type<T>;
  readonly useValue: T;
}

/**
 * A factory provider — the container invokes the factory function, injecting
 * the tokens listed in `inject` as positional arguments.
 */
export interface IFactoryProvider<T = unknown> {
  readonly provide: symbol | string | Type<T>;
  readonly useFactory: (...args: unknown[]) => T | Promise<T>;
  readonly inject?: Array<symbol | string | Type>;
}

/**
 * An alias provider — the container resolves `useExisting` from the graph
 * and publishes it under the `provide` token.
 */
export interface IExistingProvider<T = unknown> {
  readonly provide: symbol | string | Type<T>;
  readonly useExisting: symbol | string | Type<T>;
}

/**
 * Union of every supported provider shape.
 */
export type Provider<T = unknown> =
  | Type<T>
  | IClassProvider<T>
  | IValueProvider<T>
  | IFactoryProvider<T>
  | IExistingProvider<T>;
