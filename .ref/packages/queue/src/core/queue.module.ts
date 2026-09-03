/**
 * @file queue.module.ts
 * @module @stackra/queue/core
 * @description DI module for the queue system. Registers QueueManager globally.
 */

import { Module, type IDynamicModule } from '@stackra/ts-container';
import { QUEUE_MANAGER, QUEUE_CONFIG } from './constants';
import { QueueManager } from './services/queue-manager.service';
import type { IQueueModuleOptions } from './interfaces';

/**
 * Queue DI module.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     QueueModule.forRoot({
 *       default: 'memory',
 *       connections: { memory: { driver: 'memory' } },
 *       worker: { tries: 3, backoffMs: 1000 },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class QueueModule {
  /**
   * Register the queue module globally with static config.
   *
   * @param config - Queue module configuration
   * @returns Dynamic module definition
   */
  public static forRoot(config: IQueueModuleOptions): IDynamicModule {
    return {
      module: QueueModule,
      global: true,
      providers: [
        { provide: QUEUE_CONFIG, useValue: config },
        QueueManager,
        { provide: QUEUE_MANAGER, useExisting: QueueManager },
      ],
      exports: [QUEUE_CONFIG, QUEUE_MANAGER, QueueManager],
    };
  }

  /**
   * Register the queue module with async factory configuration.
   *
   * @param options - Async options with useFactory and inject
   * @returns Dynamic module definition
   */
  public static forRootAsync(options: {
    useFactory: (...args: unknown[]) => IQueueModuleOptions | Promise<IQueueModuleOptions>;
    inject?: unknown[];
  }): IDynamicModule {
    return {
      module: QueueModule,
      global: true,
      providers: [
        {
          provide: QUEUE_CONFIG,
          useFactory: options.useFactory,
          inject: (options.inject ?? []) as any[],
        },
        QueueManager,
        { provide: QUEUE_MANAGER, useExisting: QueueManager },
      ],
      exports: [QUEUE_CONFIG, QUEUE_MANAGER, QueueManager],
    };
  }

  /**
   * Register a custom queue connector for a driver name.
   *
   * The connector is instantiated via DI and registered on the
   * QueueManager via `extend(driver, factory)`.
   *
   * @param driver - Driver name (e.g., 'bullmq', 'sqs', 'kafka')
   * @param connectorType - Connector class implementing IQueueConnector
   * @returns Dynamic module definition
   *
   * @example
   * ```typescript
   * QueueModule.forFeature('bullmq', BullMQConnector);
   * ```
   */
  public static forFeature(driver: string, connectorType: Function): IDynamicModule {
    const registrationToken = Symbol.for(`QUEUE_CONNECTOR_REGISTRATION:${driver}`);

    return {
      module: QueueModule,
      providers: [
        connectorType as any,
        {
          provide: registrationToken,
          useFactory: (manager: QueueManager, connector: any) => {
            manager.extend(driver, () => connector);
            return null;
          },
          inject: [QueueManager, connectorType as any],
        },
      ],
      exports: [connectorType as any],
    };
  }
}
