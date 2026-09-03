/**
 * @file command-interceptor.service.ts
 * @module @stackra/ts-redis/observability
 * @description Command interceptor that wraps every Redis command with
 *   timing measurement and event emission. Mirrors Laravel's
 *   `Connection::command()` pattern but as a composable wrapper.
 */

import { IInjectable, Inject, Optional } from '@stackra/ts-container';
import { Logger } from '@stackra/logger';
import type { IEventEmitter } from '@stackra/contracts';
import { EVENT_EMITTER, REDIS_EVENTS } from '@stackra/contracts';

import type { ICommandExecutedEvent } from './command-executed.event';
import type { ICommandFailedEvent } from './command-failed.event';

/**
 * Command interceptor — wraps Redis commands with observability.
 *
 * For every command execution:
 * 1. Records `start = performance.now()`
 * 2. Executes the command on the underlying driver
 * 3. On success: emits `COMMAND_EXECUTED` with duration
 * 4. On failure: emits `COMMAND_FAILED` with error, then re-throws
 *
 * Follows the fail-open pattern: if the event emitter is not configured
 * or throws during emission, command execution continues unaffected.
 */
@IInjectable()
export class CommandInterceptor {
  /** Scoped logger. */
  private readonly logger = new Logger(CommandInterceptor.name);

  /** Whether observability is enabled. */
  private enabled = true;

  /**
   * @param eventEmitter - Optional event emitter for command events.
   */
  public constructor(
    @Optional() @Inject(EVENT_EMITTER) private readonly eventEmitter?: IEventEmitter
  ) {}

  /**
   * Enable or disable command observability.
   *
   * @param enabled - Whether to emit events and measure timing.
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Execute a command with timing and event emission.
   *
   * @param connectionName - The connection name for event payloads.
   * @param command - The Redis command name.
   * @param args - The command arguments.
   * @param executor - The actual command execution function.
   * @returns The command result.
   * @throws Re-throws any error from the executor after emitting COMMAND_FAILED.
   */
  public async intercept<T>(
    connectionName: string,
    command: string,
    args: (string | number)[],
    executor: () => Promise<T>
  ): Promise<T> {
    if (!this.enabled) {
      return executor();
    }

    const timestamp = Date.now();
    const start = performance.now();

    try {
      const result = await executor();
      const duration = performance.now() - start;

      this.emitExecuted({
        command,
        args,
        duration: Math.round(duration * 100) / 100,
        connection: connectionName,
        timestamp,
      });

      return result;
    } catch (error: unknown) {
      const duration = performance.now() - start;

      this.emitFailed({
        command,
        args,
        error: error instanceof Error ? error : new Error(String(error)),
        connection: connectionName,
        timestamp,
      });

      throw error;
    }
  }

  /**
   * Emit a COMMAND_EXECUTED event (fail-open).
   *
   * @param payload - The event payload.
   */
  private emitExecuted(payload: ICommandExecutedEvent): void {
    if (!this.eventEmitter) return;
    try {
      this.eventEmitter.emit(REDIS_EVENTS.COMMAND_EXECUTED, payload);
    } catch (error: Error | any) {
      this.logger.warn('[CommandInterceptor] Failed to emit COMMAND_EXECUTED', { error });
    }
  }

  /**
   * Emit a COMMAND_FAILED event (fail-open).
   *
   * @param payload - The event payload.
   */
  private emitFailed(payload: ICommandFailedEvent): void {
    if (!this.eventEmitter) return;
    try {
      this.eventEmitter.emit(REDIS_EVENTS.COMMAND_FAILED, payload);
    } catch (error: Error | any) {
      this.logger.warn('[CommandInterceptor] Failed to emit COMMAND_FAILED', { error });
    }
  }
}
