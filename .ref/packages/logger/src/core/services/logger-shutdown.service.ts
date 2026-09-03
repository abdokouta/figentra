/**
 * @file logger-shutdown.service.ts
 * @module @stackra/logger/core/services
 * @description Logger shutdown service — flushes all reporters on application shutdown.
 *   Implements OnApplicationShutdown lifecycle hook from @stackra/ts-container
 *   to ensure all buffered log entries are written before the process exits.
 *   Works in both NestJS (server) and browser (page unload, SPA teardown).
 */

import { Injectable, Inject } from '@stackra/ts-container';
import {
  LOGGER_MANAGER,
  type ILoggerManager,
  type IOnApplicationShutdown,
} from '@stackra/contracts';

/**
 * Logger shutdown service — flushes reporters on application shutdown.
 *
 * Automatically registered by LoggerModule.forRoot(). When the DI container
 * shuts down (server shutdown, page unload, app.close()), this service
 * calls `manager.flush()` to drain all reporter buffers.
 *
 * Works cross-platform:
 * - NestJS: triggered by SIGTERM, SIGINT, app.close()
 * - Browser: triggered by container teardown (SPA unmount)
 * - React Native: triggered by app background/termination
 *
 * @example
 * ```typescript
 * // Automatically registered by LoggerModule.forRoot() — no manual setup needed.
 * // Flush happens on container shutdown.
 * ```
 */
@Injectable()
export class LoggerShutdownService implements IOnApplicationShutdown {
  /**
   * @param manager - LoggerManager instance to flush on shutdown
   */
  public constructor(@Inject(LOGGER_MANAGER) private readonly manager: ILoggerManager) {}

  /**
   * Called by the DI container when the application is shutting down.
   * Flushes all reporter buffers to ensure no log entries are lost.
   *
   * @param _signal - The signal that triggered the shutdown (e.g., 'SIGTERM')
   */
  public async onApplicationShutdown(_signal?: string): Promise<void> {
    await this.manager.flush();
  }
}
