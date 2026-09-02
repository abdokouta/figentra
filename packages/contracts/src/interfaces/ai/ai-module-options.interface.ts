/**
 * @file ai-module-options.interface.ts
 * @module @stackra/contracts/interfaces/ai
 * @description Sync and async options for configuring `AiModule`.
 */

import type { ModuleMetadata } from "../modules/module-metadata.interface";
import type { InjectionToken } from "../../types/injection-token.type";
import type { OptionalFactoryDependency } from "../../types/optional-factory-dependency.type";
import type { IAiConfig } from "./ai-config.interface";

/**
 * Options accepted by `AiModule.forRoot(options)`.
 *
 * Structurally the resolved {@link IAiConfig}. Consumer apps author
 * defaults inline via `registerAs<IAiModuleOptions>("ai", () => ({
 *   ...env('AI_*', default) ... }))` and pass the resulting factory
 * through `AiModule.forRootAsync(aiConfig.asProvider())`.
 */
export type IAiModuleOptions = IAiConfig;

/**
 * Options accepted by `AiModule.forRootAsync(options)`.
 *
 * The factory resolves the module configuration; `inject` lists the providers
 * passed as positional arguments; `imports` brings their owning modules into
 * scope.
 */
export interface IAiModuleAsyncOptions {
  /** Modules to import before the factory resolves. */
  imports?: ModuleMetadata["imports"];
  /** Async factory producing the resolved options. */
  useFactory: (...args: any[]) => IAiModuleOptions | Promise<IAiModuleOptions>;
  /** Providers injected as positional arguments into `useFactory`. */
  inject?: Array<InjectionToken | OptionalFactoryDependency>;
}
