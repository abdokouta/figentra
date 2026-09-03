/**
 * @file stackra-dashboard-shim.d.ts
 * @module @stackra/scheduler/types
 * @description Ambient type shim for @stackra/dashboard.
 *
 *   The published @stackra/dashboard@1.x tarball ships without
 *   `.d.ts` output because it re-exports @heroui/react +
 *   @heroui-pro/react whose upstream published `exports.types`
 *   fields are broken, tripping tsup's rollup-based dts bundler.
 *   See `stackra/frontend/platform/src/dashboard/tsup.config.ts`
 *   for the upstream docblock.
 *
 *   This package composes `DashboardModule.forFeature({ widgets: [] })`
 *   in its `WebSchedulerModule.forRoot(...)` per the empty
 *   widget-scaffold pattern in `.kiro/steering/dashboard-widgets.md`
 *   §Retrofit note. The shim below is what tsup's dts bundler
 *   resolves so our own `.d.ts` output can inline the reference.
 *
 *   This file MUST stay a "script" (no top-level `import` / `export`)
 *   for `declare module '@stackra/dashboard'` below to register as
 *   an AMBIENT module declaration. Turning it into a module file
 *   (by adding a top-level `import type { … } from '...'`) demotes
 *   the block to a module augmentation, which requires the module
 *   to already exist — the exact condition we're working around.
 *   Cross-package types (like `DynamicModule` from `@stackra/container`)
 *   are referenced via inline `import(...)` type expressions.
 *
 *   Remove this file when @stackra/dashboard publishes a
 *   `.d.ts`-bearing tarball.
 */

declare module "@stackra/dashboard" {
  /**
   * DashboardModule — @stackra/dashboard's DI module class stub.
   *
   * The actual class shape lives in the platform repo at
   * `stackra/frontend/platform/src/dashboard/src/core/`. This
   * shim only exists so tsup's dts bundler can resolve the
   * type reference from `import { DashboardModule } from
   * "@stackra/dashboard"`.
   */
  export const DashboardModule: {
    forRoot: (options?: unknown) => import("@stackra/container").DynamicModule;
    forFeature: (options?: {
      widgets?: unknown[];
    }) => import("@stackra/container").DynamicModule;
  };
}
