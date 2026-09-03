/**
 * @file logger.service.ts
 * @module @stackra/logger/core/services
 * @description Context-bound Logger — the primary API for emitting log messages.
 *   Lightweight facade that delegates to LoggerManager for dispatch.
 *   Supports child loggers, mutable context, and performance timing.
 */

import { type ILogger, type ILogEntry, type LogContext, ILogLevel } from '@stackra/contracts';

import { LoggerManager } from './logger-manager.service';

/**
 * Context-bound logger instance.
 *
 * Created via `new Logger('ContextName')` or `LoggerManager.create('context')`.
 * Delegates all dispatch logic to the LoggerManager singleton.
 *
 * Supports child loggers: `logger.child({ requestId: 'abc' })` produces a new
 * Logger that merges the parent's metadata with the child's on every entry.
 *
 * Also supports mutable context via `withContext()` / `withoutContext()` for
 * cases where creating child loggers is too heavyweight.
 *
 * @example
 * ```typescript
 * // In a class (steering-compliant pattern)
 * private readonly logger = new Logger(OrderService.name);
 *
 * async create(dto: CreateOrderDto) {
 *   this.logger.info('Creating order', { sku: dto.sku });
 * }
 *
 * // Child logger for request scope
 * const reqLogger = this.logger.child({ requestId: req.id });
 * reqLogger.info('Processing'); // meta includes { requestId: '...' }
 *
 * // Mutable context
 * this.logger.withContext({ requestId: req.id });
 * this.logger.info('Now includes requestId');
 * this.logger.withoutContext(['requestId']);
 * ```
 */
export class Logger implements ILogger {
  /** Mutable inherited metadata — modified by `withContext()` / `withoutContext()`. */
  private inheritedMeta: LogContext;

  /** Performance timing marks. */
  private readonly timers: Map<string, number> = new Map();

  /**
   * @param context - Source context name (typically ClassName.name)
   * @param channelName - Target channel (defaults to manager's default)
   * @param manager - LoggerManager instance (uses static ref if not provided)
   * @param initialMeta - Metadata inherited from parent logger (child loggers)
   */
  public constructor(
    private readonly context: string,
    private readonly channelName?: string,
    private readonly manager?: LoggerManager,
    initialMeta?: LogContext
  ) {
    this.inheritedMeta = initialMeta ? { ...initialMeta } : {};
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Public Logging Methods
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Log a debug-level message.
   *
   * @param message - Human-readable message
   * @param meta - Optional structured context data
   */
  public debug(message: string, meta?: LogContext): void {
    this.emit(ILogLevel.DEBUG, message, undefined, meta);
  }

  /**
   * Log an info-level message.
   *
   * @param message - Human-readable message
   * @param meta - Optional structured context data
   */
  public info(message: string, meta?: LogContext): void {
    this.emit(ILogLevel.INFO, message, undefined, meta);
  }

  /**
   * Log a warn-level message.
   *
   * @param message - Human-readable message
   * @param meta - Optional structured context data
   */
  public warn(message: string, meta?: LogContext): void {
    this.emit(ILogLevel.WARN, message, undefined, meta);
  }

  /**
   * Log an error-level message.
   *
   * @param message - Human-readable message
   * @param error - Optional error object
   * @param meta - Optional structured context data
   */
  public error(message: string, error?: Error | unknown, meta?: LogContext): void {
    this.emit(ILogLevel.ERROR, message, error, meta);
  }

  /**
   * Log a fatal-level message.
   *
   * @param message - Human-readable message
   * @param error - Optional error object
   * @param meta - Optional structured context data
   */
  public fatal(message: string, error?: Error | unknown, meta?: LogContext): void {
    this.emit(ILogLevel.FATAL, message, error, meta);
  }

  /**
   * Log at an arbitrary level.
   * Accepts a ILogLevel enum value or a string that matches a level name.
   *
   * @param level - Severity level (enum value or string like 'info', 'error')
   * @param message - Human-readable message
   * @param meta - Optional structured context data
   */
  public log(level: ILogLevel | string, message: string, meta?: LogContext): void {
    const resolvedLevel = this.resolveLevel(level);
    this.emit(resolvedLevel, message, undefined, meta);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Child Logger
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Create a child logger that inherits this logger's context and merges
   * additional metadata into every emitted entry.
   *
   * Supports nesting: `logger.child({ a: 1 }).child({ b: 2 })` produces
   * entries with both `{ a: 1, b: 2 }` in their meta field.
   *
   * @param meta - Additional metadata to attach to every entry
   * @returns A new Logger instance with merged metadata
   */
  public child(meta: LogContext): ILogger {
    const mergedMeta: LogContext = { ...this.inheritedMeta, ...meta };
    return new Logger(this.context, this.channelName, this.manager, mergedMeta);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Mutable Context
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Mutably merge metadata into this logger's inherited context.
   * Unlike `child()`, this modifies the current instance in-place.
   *
   * @param meta - Key-value pairs to merge into context
   * @returns This logger instance for chaining
   */
  public withContext(meta: LogContext): ILogger {
    Object.assign(this.inheritedMeta, meta);
    return this;
  }

  /**
   * Mutably remove metadata keys from this logger's inherited context.
   * If no keys are specified, clears all inherited context.
   *
   * @param keys - Specific keys to remove, or omit to clear all
   * @returns This logger instance for chaining
   */
  public withoutContext(keys?: string[]): ILogger {
    if (!keys || keys.length === 0) {
      this.inheritedMeta = {};
    } else {
      for (const key of keys) {
        delete this.inheritedMeta[key];
      }
    }
    return this;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Performance Timing
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Start a performance timing measurement.
   * Uses `performance.mark()` when available, falls back to Date.now().
   *
   * @param label - Identifier for this timing measurement
   */
  public time(label: string): void {
    if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
      try {
        performance.mark(`logger:${label}:start`);
      } catch {
        // Ignore mark errors
      }
    }
    this.timers.set(label, Date.now());
  }

  /**
   * End a performance timing measurement and log the duration at DEBUG level.
   * Cleans up the performance mark.
   *
   * @param label - Identifier matching a previous `time()` call
   */
  public timeEnd(label: string): void {
    const startTime = this.timers.get(label);
    if (startTime === undefined) {
      return;
    }

    this.timers.delete(label);
    let durationMs: number;

    if (typeof performance !== 'undefined' && typeof performance.measure === 'function') {
      try {
        const measure = performance.measure(`logger:${label}`, `logger:${label}:start`);
        durationMs = measure.duration;
      } catch {
        durationMs = Date.now() - startTime;
      }
    } else {
      durationMs = Date.now() - startTime;
    }

    this.debug(`Timer [${label}] completed`, {
      label,
      durationMs: Math.round(durationMs * 100) / 100,
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Private
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Resolve a level string to a ILogLevel enum value.
   *
   * @param level - Level as enum or string
   * @returns Resolved ILogLevel
   */
  private resolveLevel(level: ILogLevel | string): ILogLevel {
    if (Object.values(ILogLevel).includes(level as ILogLevel)) {
      return level as ILogLevel;
    }
    // Map common string variants
    const normalized = (level as string).toLowerCase();
    const map: Record<string, ILogLevel> = {
      debug: ILogLevel.DEBUG,
      info: ILogLevel.INFO,
      warn: ILogLevel.WARN,
      warning: ILogLevel.WARN,
      error: ILogLevel.ERROR,
      fatal: ILogLevel.FATAL,
      silent: ILogLevel.SILENT,
    };
    return map[normalized] ?? ILogLevel.INFO;
  }

  /**
   * Build a log entry and dispatch to the manager.
   *
   * @param level - Severity level
   * @param message - Message text
   * @param error - Optional error
   * @param meta - Optional metadata
   */
  private emit(level: ILogLevel, message: string, error?: unknown, meta?: LogContext): void {
    const mgr = this.manager ?? LoggerManager.instance;

    // Graceful no-op if logger is used before module initialization
    if (!mgr) {
      // eslint-disable-next-line no-console
      console.log(`[${level.toUpperCase()}] [${this.context}] ${message}`);
      return;
    }

    // Merge inherited (parent) meta with per-call meta (call meta wins)
    const hasInherited = Object.keys(this.inheritedMeta).length > 0;
    const mergedMeta: LogContext | undefined =
      hasInherited || meta
        ? { ...(hasInherited ? this.inheritedMeta : {}), ...(meta ?? {}) }
        : undefined;

    const entry: ILogEntry = {
      level,
      message,
      context: this.context,
      timestamp: new Date().toISOString(),
      meta: mergedMeta,
      error: error instanceof Error ? error : undefined,
    };

    mgr.dispatch(entry, this.channelName);
  }
}
