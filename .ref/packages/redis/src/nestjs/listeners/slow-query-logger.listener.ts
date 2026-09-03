/**
 * @file slow-query-logger.listener.ts
 * @module @stackra/nestjs-redis/listeners
 * @description Event listener that logs Redis commands exceeding the
 *   configured slow-query threshold. Registered on COMMAND_EXECUTED events.
 */

import { IInjectable, Inject, Optional, type IOnModuleInit } from '@nestjs/common';
import { Logger } from '@stackra/logger';

import type { IEventEmitter, IRedisModuleOptions } from '@stackra/contracts';
import { REDIS_CONFIG, REDIS_EVENTS, EVENT_EMITTER } from '@stackra/contracts';
import type { ICommandExecutedEvent } from '../../core/observability';
import { DEFAULT_SLOW_QUERY_THRESHOLD } from '../../core/constants';

/**
 * Slow query logger.
 *
 * Listens for `REDIS_EVENTS.COMMAND_EXECUTED` events and logs a warning
 * when the execution time exceeds the configured threshold.
 */
@IInjectable()
export class SlowQueryLogger implements IOnModuleInit {
  /** Scoped logger. */
  private readonly logger = new Logger(SlowQueryLogger.name);

  /** Slow query threshold in milliseconds. */
  private readonly threshold: number;

  /**
   * @param config - Module configuration for threshold.
   * @param eventEmitter - Optional event emitter to subscribe to.
   */
  public constructor(
    @Inject(REDIS_CONFIG) config: IRedisModuleOptions,
    @Optional() @Inject(EVENT_EMITTER) private readonly eventEmitter?: IEventEmitter
  ) {
    this.threshold = config.observability?.slowQueryThreshold ?? DEFAULT_SLOW_QUERY_THRESHOLD;
  }

  /**
   * Subscribe to command executed events on module init.
   */
  public onModuleInit(): void {
    if (!this.eventEmitter) return;

    this.eventEmitter.on(REDIS_EVENTS.COMMAND_EXECUTED, ((event: ICommandExecutedEvent) => {
      if (event.duration >= this.threshold) {
        this.logger.warn(
          `[SlowQuery] ${event.command} on "${event.connection}" took ${event.duration.toFixed(2)}ms (threshold: ${this.threshold}ms)`,
          { command: event.command, args: event.args, duration: event.duration }
        );
      }
    }) as any);
  }
}
