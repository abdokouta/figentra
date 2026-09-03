/**
 * @file pino.reporter.ts
 * @module @stackra/logger/nestjs/reporters
 * @description Pino reporter — bridges @stackra/logger into pino for NestJS.
 *   Uses pino for high-performance structured JSON logging with log rotation,
 *   pretty-printing in dev, and transport support (file, cloud, etc.).
 *
 *   Auto-detects development mode and enables pino-pretty when available.
 *   This is the recommended reporter for NestJS backends in production.
 */

import { Injectable } from '@nestjs/common';
import { type ILogReporter, type ILogEntry, ILogLevel } from '@stackra/contracts';

import { Reporter } from '../../core/decorators/reporter.decorator';

/**
 * Maps our ILogLevel to pino log level strings.
 */
export const PINO_LEVEL_MAP: Record<ILogLevel, string> = {
  [ILogLevel.DEBUG]: 'debug',
  [ILogLevel.INFO]: 'info',
  [ILogLevel.WARN]: 'warn',
  [ILogLevel.ERROR]: 'error',
  [ILogLevel.FATAL]: 'fatal',
  [ILogLevel.SILENT]: 'silent',
};

/**
 * Pino reporter — writes structured log entries via pino.
 *
 * When used in NestJS, this reporter bridges our LoggerManager into pino,
 * enabling pino's transport ecosystem (file rotation, cloud logging,
 * pretty-printing in dev, etc.).
 *
 * In non-production environments (NODE_ENV !== 'production'), automatically
 * attempts to configure pino-pretty for human-readable output. Falls back
 * to standard JSON output if pino-pretty is not installed.
 *
 * Pino is lazily imported to keep it optional — if not installed, falls
 * back to JSON stdout (same behavior as JsonReporter).
 *
 * @example
 * ```typescript
 * // In NestJS module
 * NestLoggerModule.forRoot({
 *   default: 'app',
 *   channels: {
 *     app: { level: 'info', reporters: ['pino'] },
 *   },
 * });
 * ```
 */
@Reporter('pino')
export class PinoReporter implements ILogReporter {
  /** Reporter identifier. */
  public readonly name = 'pino';

  /** Pino logger instance — lazily initialized. */
  private pino: any = null;

  /**
   * Initialize pino instance lazily on first write.
   * In development, attempts to use pino-pretty for readable output.
   * Falls back to console.log if pino is not installed.
   *
   * @returns Pino logger instance (or console fallback)
   */
  private ensurePino(): any {
    if (this.pino) return this.pino;

    try {
      // Dynamic import to keep pino as optional peer dependency
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pinoLib = require('pino');

      const isProduction = (globalThis as any).process?.env?.NODE_ENV === 'production';

      if (!isProduction) {
        // Attempt to use pino-pretty in non-production environments
        try {
          this.pino = pinoLib({
            level: 'debug',
            timestamp: () => `,"time":"${new Date().toISOString()}"`,
            transport: {
              target: 'pino-pretty',
            },
          });
          return this.pino;
        } catch {
          // pino-pretty not installed — fall through to standard pino
        }
      }

      // Production or pino-pretty not available — standard JSON output
      this.pino = pinoLib({
        level: 'debug',
        timestamp: () => `,"time":"${new Date().toISOString()}"`,
      });
    } catch {
      // Pino not installed — use a simple JSON fallback
      this.pino = {
        debug: (obj: unknown, msg?: string) =>
          console.log(JSON.stringify({ ...(obj as any), msg })),
        info: (obj: unknown, msg?: string) => console.log(JSON.stringify({ ...(obj as any), msg })),
        warn: (obj: unknown, msg?: string) =>
          console.warn(JSON.stringify({ ...(obj as any), msg })),
        error: (obj: unknown, msg?: string) =>
          console.error(JSON.stringify({ ...(obj as any), msg })),
        fatal: (obj: unknown, msg?: string) =>
          console.error(JSON.stringify({ ...(obj as any), msg })),
      };
    }

    return this.pino;
  }

  /**
   * Write a log entry to pino.
   *
   * @param entry - Structured log entry
   */
  public write(entry: ILogEntry): void {
    const logger = this.ensurePino();
    const level = PINO_LEVEL_MAP[entry.level] ?? 'info';

    const logObj: Record<string, unknown> = {
      context: entry.context,
      ...(entry.meta ?? {}),
    };

    if (entry.error) {
      logObj.err = {
        name: entry.error.name,
        message: entry.error.message,
        stack: entry.error.stack,
      };
    }

    // Call the appropriate pino level method
    if (typeof logger[level] === 'function') {
      logger[level](logObj, entry.message);
    }
  }

  /**
   * Flush pino's buffers — ensures all pending writes complete.
   *
   * @returns Promise that resolves when flush is complete
   */
  public async flush(): Promise<void> {
    if (this.pino && typeof this.pino.flush === 'function') {
      return new Promise<void>((resolve) => {
        this.pino.flush(() => resolve());
      });
    }
  }
}
