/**
 * @file index.ts
 * @module @stackra/contracts/primitives
 * @description Public API barrel for DI framework primitives.
 */

export type { Type } from "./type.type";
export type {
  Provider,
  IClassProvider,
  IValueProvider,
  IFactoryProvider,
  IExistingProvider,
} from "./provider.interface";
export type { DynamicModule } from "./dynamic-module.interface";
export type { OnModuleInit } from "./on-module-init.interface";
export type { OnApplicationBootstrap } from "./on-application-bootstrap.interface";
export { Scope } from "./scope.enum";
