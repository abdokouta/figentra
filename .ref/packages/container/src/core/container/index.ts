/**
 * @file index.ts
 * @module @stackra/container/container
 * @description Container Barrel Export
 *
 *   Pure DI engine: injector, registries, scanner, instance loader, module internals.
 */

export { Injector } from "@/core/container/injector.service";
export { InstanceLoader } from "@/core/container/instance-loader.service";
export { DependenciesScanner } from "@/core/container/scanner.service";
export { ModuleContainer } from "@/core/container/container.registry";
export { DiscoverableMetaHostCollection } from "@/core/container/discoverable-meta-host-collection.registry";
export { Module } from "@/core/container/module";
export { ModuleRef } from "@/core/container/module-ref";
export type { IModuleRefGetOptions } from "@/core/container/module-ref";
export { InstanceWrapper } from "@/core/container/instance-wrapper";
