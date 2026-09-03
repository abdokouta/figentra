/**
 * @file pretty.formatter.ts
 * @module @stackra/logger/core/formatters
 * @description Pretty formatter — human-readable colored log output.
 *   Ideal for development environments with timestamps, level badges,
 *   context, message, and formatted metadata.
 */

import type { ILogEntry, ILogFormatter } from '@stackra/contracts';

/**
 * ANSI color codes for log levels.
 */
export const LEVEL_COLORS: Record<string, string> = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m', // green
  warn: '\x1b[33m', // yellow
  error: '\x1b[31m', // red
  fatal: '\x1b[35m', // magenta
};

/** ANSI reset code. */
export const RESET = '\x1b[0m';
/** ANSI dim code. */
export const DIM = '\x1b[2m';
/** ANSI bold code. */
export const BOLD = '\x1b[1m';

/**
 * Pretty formatter — produces human-readable, colored log output.
 *
 * Output format:
 * ```
 * 2026-06-04 10:30:00 [INFO] [UserService] User created successfully { userId: "abc123" }
 * ```
 *
 * Features:
 * - ANSI color codes for terminal output
 * - Level-specific coloring
 * - Timestamp formatting (date + time, no ISO suffix)
 * - Context badge in brackets
 * - Inline meta output for short objects
 * - Multi-line error stack traces
 */
export class PrettyFormatter implements ILogFormatter {
  /** Formatter identifier. */
  public readonly name = 'pretty';

  /**
   * Format a log entry as a human-readable colored string.
   *
   * @param entry - Log entry to format
   * @returns Formatted string with ANSI color codes
   */
  public format(entry: ILogEntry): string {
    const color = LEVEL_COLORS[entry.level] ?? '';
    const levelBadge = `${color}${BOLD}[${entry.level.toUpperCase()}]${RESET}`;
    const timestamp = `${DIM}${this.formatTimestamp(entry.timestamp)}${RESET}`;
    const context = `${DIM}[${entry.context}]${RESET}`;

    let line = `${timestamp} ${levelBadge} ${context} ${entry.message}`;

    // Append metadata inline if present
    if (entry.meta && Object.keys(entry.meta).length > 0) {
      const metaStr = JSON.stringify(entry.meta, null, 0);
      line += ` ${DIM}${metaStr}${RESET}`;
    }

    // Append error stack on a new line
    if (entry.error?.stack) {
      line += `\n${DIM}${entry.error.stack}${RESET}`;
    }

    return line;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Private
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Format an ISO timestamp to a shorter human-readable form.
   *
   * @param iso - ISO-8601 timestamp string
   * @returns Formatted timestamp (YYYY-MM-DD HH:mm:ss)
   */
  private formatTimestamp(iso: string): string {
    return iso.replace('T', ' ').replace(/\.\d{3}Z$/, '');
  }
}
