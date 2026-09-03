/**
 * @file web-scheduler.module.ts
 * @module @stackra/scheduler/react
 * @description `WebSchedulerModule` — the React/web-runtime binding
 *   on top of {@link SchedulerModule}. Composes the core module +
 *   scaffolds the dashboard-widget contribution seam.
 */

import { Module, type DynamicModule } from "@stackra/container";
import type { ISchedulerModuleOptions } from "../core/interfaces/scheduler-module-options.interface";

import { SchedulerModule } from "../core/scheduler.module";
import { DashboardModule } from "@stackra/dashboard";

/**
 * Web-runtime binding for `@stackra/scheduler`.
 *
 * @example
 * ```typescript
 * import { Module } from "@stackra/container";
 * import { WebSchedulerModule } from "@stackra/scheduler/react";
 *
 * @Module({
 *   imports: [WebSchedulerModule.forRoot()],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class WebSchedulerModule {
  /**
   * Configure the web-runtime scheduler module.
   *
   * @param options - Module options. Forwarded to
   *   `SchedulerModule.forRoot(...)`.
   * @returns A dynamic module ready to add to `imports`.
   */
  public static forRoot(options: ISchedulerModuleOptions = {}): DynamicModule {
    return {
      module: WebSchedulerModule,
      global: true,
      imports: [
        SchedulerModule.forRoot(options),
        // Empty widget-scaffold slot per subpath-layering.md §Accepted exception.
        DashboardModule.forFeature({ widgets: [] }),
      ],
      exports: [SchedulerModule],
    };
  }
}
