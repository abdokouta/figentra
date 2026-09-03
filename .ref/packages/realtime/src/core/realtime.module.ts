/**
 * @file realtime.module.ts
 * @module @stackra/realtime/core
 * @description DI module for the realtime system.
 *   Registers RealtimeManager globally. Drivers registered via forFeature().
 */

import { Module, type IDynamicModule } from '@stackra/ts-container';
import { REALTIME_MANAGER, REALTIME_CONFIG } from './constants';
import { RealtimeManager } from './services/realtime-manager.service';
import type { IRealtimeModuleOptions } from './interfaces';

/**
 * Realtime DI module.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     RealtimeModule.forRoot({
 *       default: 'main',
 *       connections: { main: { driver: 'socketio', url: 'wss://api.example.com' } },
 *     }),
 *     RealtimeModule.forFeature('socketio', SocketIoConnector),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class RealtimeModule {
  /**
   * Configure the realtime module with static config.
   *
   * @param config - Realtime module configuration
   * @returns Dynamic module definition
   */
  public static forRoot(config: IRealtimeModuleOptions): IDynamicModule {
    return {
      module: RealtimeModule,
      global: true,
      providers: [
        { provide: REALTIME_CONFIG, useValue: config },
        RealtimeManager,
        { provide: REALTIME_MANAGER, useExisting: RealtimeManager },
      ],
      exports: [REALTIME_CONFIG, REALTIME_MANAGER, RealtimeManager],
    };
  }

  /**
   * Configure the realtime module with async factory.
   *
   * @param options - Async options with useFactory and inject
   * @returns Dynamic module definition
   */
  public static forRootAsync(options: {
    useFactory: (...args: unknown[]) => IRealtimeModuleOptions | Promise<IRealtimeModuleOptions>;
    inject?: unknown[];
  }): IDynamicModule {
    return {
      module: RealtimeModule,
      global: true,
      providers: [
        {
          provide: REALTIME_CONFIG,
          useFactory: options.useFactory,
          inject: (options.inject ?? []) as any[],
        },
        RealtimeManager,
        { provide: REALTIME_MANAGER, useExisting: RealtimeManager },
      ],
      exports: [REALTIME_CONFIG, REALTIME_MANAGER, RealtimeManager],
    };
  }

  /**
   * Register a connector for a specific driver name.
   *
   * The connector is instantiated via DI and registered on the
   * RealtimeManager via `extend(driver, factory)`.
   *
   * @param driver - Driver name (e.g., 'socketio', 'pusher')
   * @param connectorType - Connector class implementing IRealtimeConnector
   * @returns Dynamic module definition
   */
  public static forFeature(driver: string, connectorType: Function): IDynamicModule {
    const registrationToken = Symbol.for(`REALTIME_CONNECTOR_REG:${driver}`);

    return {
      module: RealtimeModule,
      providers: [
        connectorType as any,
        {
          provide: registrationToken,
          useFactory: (manager: RealtimeManager, connector: any) => {
            // The connector's connect() method is called when the connection is first resolved
            manager.registerConnection(driver, connector);
            return null;
          },
          inject: [RealtimeManager, connectorType as any],
        },
      ],
      exports: [connectorType as any],
    };
  }
}
