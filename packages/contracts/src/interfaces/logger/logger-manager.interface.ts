/**
 * @file logger-manager.interface.ts
 * @module @stackra/contracts/interfaces/logger
 * @description Contract for the workspace's canonical logging manager.
 *   Injected via `LOGGER_MANAGER`. Supports multiple channels + drivers.
 */

/**
 * Log severity levels (ascending).
 */
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

/**
 * A single log channel returned by `ILoggerManager.channel()`.
 */
export interface ILogChannel {
  /** Log at debug severity. */
  debug(message: string, context?: Record<string, unknown>): void;
  /** Log at info severity. */
  info(message: string, context?: Record<string, unknown>): void;
  /** Log at warn severity. */
  warn(message: string, context?: Record<string, unknown>): void;
  /** Log at error severity. */
  error(message: string, context?: Record<string, unknown>): void;
  /** Log at fatal severity. */
  fatal(message: string, context?: Record<string, unknown>): void;
}

/**
 * Logger manager contract — injected via `LOGGER_MANAGER`.
 */
export interface ILoggerManager {
  /**
   * Returns a named log channel. Channels are lazily initialised on
   * first access.
   *
   * @param name - Channel name (e.g. the service/package slug).
   * @returns The log channel instance.
   */
  channel(name?: string): ILogChannel;
}
