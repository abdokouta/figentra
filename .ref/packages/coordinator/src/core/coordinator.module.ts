/**
 * @file coordinator.module.ts
 * @module @stackra/coordinator/core
 * @description DI module for cross-tab coordination.
 *
 *   Config is authored in the consumer app via `registerAs(...)`
 *   from `@stackra/config` — see `packages/frontend/coordinator/
 *   config/coordinator.config.ts` for the reference template.
 */

import { Module, type DynamicModule } from "@stackra/container";
import {
  TAB_COORDINATOR,
  TAB_LOCK_MANAGER,
  TAB_TRANSPORT_MANAGER,
  type IConfigModuleAsyncOptions,
} from "@stackra/contracts";

import { COORDINATOR_CONFIG } from "@stackra/contracts";
import { CoordinatorTransport } from "./services/coordinator-transport.service";
import { LockManager } from "./services/lock-manager.service";
import { TabCoordinator } from "./services/tab-coordinator.service";
import { TabTransportManager } from "./services/tab-transport-manager.service";

import type { ICoordinatorModuleOptions } from "./interfaces";

/**
 * Coordinator DI module — cross-tab leader election and distributed
 * locks.
 *
 * @example
 * ```typescript
 * import { registerAs, env, ConfigModule } from '@stackra/config';
 * import { CoordinatorModule } from '@stackra/coordinator';
 *
 * const coordinatorConfig = registerAs('coordinator', () => ({
 *   channelName: env('COORDINATOR_CHANNEL', 'my-app'),
 *   heartbeatMs: env.number('COORDINATOR_HEARTBEAT_MS', 1000),
 * }));
 *
 * @Module({
 *   imports: [
 *     ConfigModule.forRoot({ isGlobal: true, load: [coordinatorConfig] }),
 *     CoordinatorModule.forRootAsync(coordinatorConfig.asProvider()),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class CoordinatorModule {
  /**
   * Sync entry point — takes a fully-formed
   * `ICoordinatorModuleOptions`. Escape hatch for tests + inline
   * configs; prefer `forRootAsync` with a `registerAs(...)` factory.
   *
   * @throws Error when `config` is `undefined` / `null`.
   */
  public static forRoot(config: ICoordinatorModuleOptions): DynamicModule {
    if (config === undefined || config === null) {
      throw new Error(
        "@stackra/coordinator: CoordinatorModule.forRoot(config) requires a config " +
          "argument. Pass a plain `ICoordinatorModuleOptions`, or use " +
          "`CoordinatorModule.forRootAsync(coordinatorConfig.asProvider())` with a " +
          "`registerAs(...)` factory from `@stackra/config`.",
      );
    }

    return {
      module: CoordinatorModule,
      global: true,
      providers: [
        { provide: COORDINATOR_CONFIG, useValue: config },
        TabTransportManager,
        { provide: TAB_TRANSPORT_MANAGER, useExisting: TabTransportManager },
        TabCoordinator,
        { provide: TAB_COORDINATOR, useExisting: TabCoordinator },
        LockManager,
        { provide: TAB_LOCK_MANAGER, useExisting: LockManager },
        CoordinatorTransport,
      ],
      exports: [
        TabTransportManager,
        TAB_TRANSPORT_MANAGER,
        TabCoordinator,
        TAB_COORDINATOR,
        LockManager,
        TAB_LOCK_MANAGER,
        CoordinatorTransport,
      ],
    };
  }

  /**
   * Async entry point — accepts the exact `.asProvider()` output
   * from a `registerAs(...)` factory.
   */
  public static forRootAsync(
    options: IConfigModuleAsyncOptions<ICoordinatorModuleOptions>,
  ): DynamicModule {
    return {
      module: CoordinatorModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        {
          provide: COORDINATOR_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        TabTransportManager,
        { provide: TAB_TRANSPORT_MANAGER, useExisting: TabTransportManager },
        TabCoordinator,
        { provide: TAB_COORDINATOR, useExisting: TabCoordinator },
        LockManager,
        { provide: TAB_LOCK_MANAGER, useExisting: LockManager },
        CoordinatorTransport,
      ],
      exports: [
        TabTransportManager,
        TAB_TRANSPORT_MANAGER,
        TabCoordinator,
        TAB_COORDINATOR,
        LockManager,
        TAB_LOCK_MANAGER,
        CoordinatorTransport,
      ],
    };
  }
}
