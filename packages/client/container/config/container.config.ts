/**
 * @file container.config.ts
 * @module @stackra/container/config
 * @description Consumer template for the container's namespaced
 *   configuration factory.
 *
 *   Note: `@stackra/container` sits BELOW `@stackra/config` in the
 *   workspace dependency graph (`config` peer-deps `container`).
 *   Consumer apps install both packages independently; this template
 *   references `@stackra/config` because the consumer's app-level
 *   wiring imports both packages.
 *
 * @example
 * ```typescript
 * import { ApplicationFactory } from '@stackra/container';
 * import { AppModule } from '../../app.module';
 * import { containerConfig } from '../../config/container.config';
 *
 * const app = await ApplicationFactory.create(AppModule, await containerConfig());
 * ```
 */

import { registerAs } from "@stackra/config";
import { CONTAINER_CONFIG } from "@stackra/contracts";

/**
 * Container bootstrap namespace — reachable via
 * `ConfigService.get('container')` and consumed at the
 * `ApplicationFactory.create` call site as `await containerConfig()`.
 *
 * The workspace's canonical shape for these options is
 * `IApplicationFactoryOptions` in `@stackra/container`. When that
 * interface is re-exported from the container package's public
 * barrel, add `registerAs<IApplicationFactoryOptions>` here to catch
 * shape drift at authoring time.
 */
export const containerConfig = registerAs(CONTAINER_CONFIG, () => ({
  /*
  |--------------------------------------------------------------------------
  | Debug Mode
  |--------------------------------------------------------------------------
  |
  | When true, exposes the application instance on `window[globalName]`
  | for browser devtools inspection:
  |   window.__APP__.get(UserService)
  |
  | Consumers using Vite typically wire this to `import.meta.env.DEV`
  | at the CALL SITE (a Vite build-time constant that tree-shakes the
  | dev-only branch out of production bundles). Do NOT rewrite that as
  | `env.bool('DEV', false)` — a runtime lookup would defeat the
  | dead-branch elimination.
  |
  */
  debug: true,

  /*
  |--------------------------------------------------------------------------
  | Global Name
  |--------------------------------------------------------------------------
  |
  | The window property name for debug access.
  | Only used when `debug` is true.
  |
  */
  globalName: "__APP__",

  /*
  |--------------------------------------------------------------------------
  | Shutdown Hooks
  |--------------------------------------------------------------------------
  |
  | Register `beforeunload` / `SIGTERM` shutdown hooks automatically.
  | Triggers `onModuleDestroy` and `onApplicationShutdown` on all providers.
  |
  */
  shutdownHooks: true,
}));
