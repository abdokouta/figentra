/**
 * @file type.type.ts
 * @module @stackra/contracts/primitives
 * @description Generic constructor type used throughout the DI system.
 *   Represents any class that can be instantiated with `new`. This is the
 *   workspace's canonical `Type<T>` — identical to NestJS's `Type<T>` and
 *   Angular's `Type<T>`.
 */

/**
 * Represents a newable class whose instances are assignable to `T`.
 *
 * @typeParam T - The instance type the constructor produces.
 *
 * @example
 * ```ts
 * import { Type } from "@stackra/contracts";
 *
 * function createInstance<T>(Cls: Type<T>): T {
 *   return new Cls();
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Type<T = any> = new (...args: any[]) => T;
