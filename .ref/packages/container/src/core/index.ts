/**
 * @file index.ts
 * @module @stackra/container
 * @description @stackra/container
 *
 *   NestJS-compatible dependency injection for both client and server.
 *   Structurally identical to NestJS's DI — same decorators, modules,
 *   lifecycle hooks, and provider patterns.
 */

import "reflect-metadata";

// ============================================================================
// Decorators
// ============================================================================
export { Inject } from "@/core/decorators/inject.decorator";
export { Module } from "@/core/decorators/module.decorator";
export { Global } from "@/core/decorators/global.decorator";
export { Optional } from "@/core/decorators/optional.decorator";
export { Injectable } from "@/core/decorators/injectable.decorator";

// ============================================================================
// DI foundation types & enums (re-exported from @stackra/contracts)
// ============================================================================
export type {
  Type,
  InjectionToken,
  OptionalFactoryDependency,
  Provider,
  ClassProvider,
  ValueProvider,
  FactoryProvider,
  ExistingProvider,
  ModuleMetadata,
  DynamicModule,
  ForwardReference,
  OnModuleInit,
  OnModuleDestroy,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  BeforeApplicationShutdown,
  ScopeOptions,
} from "@stackra/contracts";

export { Scope } from "@stackra/contracts";

// ============================================================================
// Utilities
// ============================================================================
export { forwardRef } from "@/core/utils/forward-ref.util";
export { hasOnModuleInit } from "@/core/utils/has-on-module-init.util";
export { hasOnModuleDestroy } from "@/core/utils/has-on-module-destroy.util";

// ============================================================================
// Application Bootstrap
// ============================================================================
export { ApplicationFactory } from "@/core/application/application.factory";
export { ApplicationContext, RequestApplicationContext } from "@/core/application/application-context.service";
export { ApplicationBuilder } from "@/core/application/application-builder.service";
export type { IApplicationFactoryOptions } from "@/core/interfaces";
export {
  getGlobalApplicationContext,
  hasGlobalApplicationContext,
  clearGlobalApplicationContext,
} from "@/core/utils/global-application.util";

// ============================================================================
// inject() — Lazy DI resolution for module-level constants
// ============================================================================
export { inject } from "@/core/utils/inject.util";

// ============================================================================
// DI Engine (Container, Injector, Scanner, Module, etc.)
// ============================================================================
export { Injector } from "@/core/container/injector.service";
export { ModuleContainer } from "@/core/container/container.registry";
export { ModuleRef } from "@/core/container/module-ref";
export type { IModuleRefGetOptions } from "@/core/container/module-ref";
export { DependenciesScanner } from "@/core/container/scanner.service";
export { InstanceWrapper } from "@/core/container/instance-wrapper";
export { RequestContext, RequestContextFactory, RequestContextRegistry, REQUEST_SCOPE, isRequestScope } from "@/core/contexts/request";
export type { RequestContextValues, RequestContextInput } from "@/core/contexts/request";

// ============================================================================
// Services
// ============================================================================
export { Reflector } from "@/core/module/reflector.service";

// ============================================================================
// Discovery
// ============================================================================
export {
  DiscoveryService,
  ContainerDiscoveryService,
  DiscoveryModule,
  DiscoverableMetaHostCollection,
} from "@/core/discovery";

// ============================================================================
// Constants
// ============================================================================
export {
  MODULE_METADATA,
  PARAMTYPES_METADATA,
  INJECTABLE_WATERMARK,
  GLOBAL_MODULE_METADATA,
  SCOPE_OPTIONS_METADATA,
  OPTIONAL_DEPS_METADATA,
  PROPERTY_DEPS_METADATA,
  SELF_DECLARED_DEPS_METADATA,
  OPTIONAL_PROPERTY_DEPS_METADATA,
  DISCOVERABLE_DECORATOR_KEY_PREFIX,
  DEFAULT_GLOBAL_NAME,
} from "@/core/constants";

// ============================================================================
// Mixins
// ============================================================================
export { WithEnvironment } from "@/core/mixins";
export type { IEnvironmentAware } from "@/core/mixins";

// React bindings intentionally live only in the `/react` and `/native`
// subpaths. Keeping them out of the root entry prevents Worker/Node bundles
// from pulling React into otherwise runtime-agnostic applications.
