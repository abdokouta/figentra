/**
 * @file file.reporter.ts
 * @module @stackra/logger/nestjs/reporters
 * @description File reporter with daily rotation for NestJS backends.
 *   Writes log entries as JSON lines to the filesystem with automatic
 *   daily file rotation and configurable retention.
 */

import { Injectable } from '@nestjs/common';
import { type ILogReporter, type ILogEntry } from '@stackra/contracts';
import * as fs from 'fs';
import * as path from 'path';

import { Reporter } from '../../core/decorators/reporter.decorator';

/**
 * File reporter — writes log entries as JSON lines to the filesystem.
 *
 * Features:
 * - Daily rotation (new file per day based on date suffix)
 * - Configurable max file count (old files auto-deleted)
 * - Configurable max file size
 * - Lazy stream creation (no file until first write)
 * - Graceful flush on shutdown
 *
 * @example
 * ```typescript
 * const fileReporter = new FileReporter({
 *   path: '/var/log/app.log',
 *   maxFiles: 14,
 *   maxSize: 100 * 1024 * 1024, // 100MB
 * });
 * manager.registerReporter(fileReporter);
 * ```
 */
export @Reporter('file')
class FileReporter implements ILogReporter {
  /** Reporter identifier. */
  public readonly name = 'file';

  /** Active write stream. */
  private stream: fs.WriteStream | null = null;

  /** Current file date (YYYY-MM-DD) for rotation detection. */
  private currentDate: string = '';

  /** Current file size in bytes. */
  private currentSize = 0;

  /** Resolved max files (default 7). */
  private readonly maxFiles: number;

  /** Resolved max size in bytes (default 50MB). */
  private readonly maxSize: number;

  /**
   * @param config - File reporter configuration
   */
  public constructor(private readonly config: IFileReporterConfig) {
    this.maxFiles = config.maxFiles ?? 7;
    this.maxSize = config.maxSize ?? 50 * 1024 * 1024;
  }

  /**
   * Write a log entry as a JSON line to the current log file.
   * Automatically rotates the file if the date has changed or size exceeds max.
   *
   * @param entry - Structured log entry
   */
  public write(entry: ILogEntry): void {
    this.ensureStream();

    const line =
      JSON.stringify({
        timestamp: entry.timestamp,
        level: entry.level,
        context: entry.context,
        message: entry.message,
        meta: entry.meta,
        error: entry.error
          ? { name: entry.error.name, message: entry.error.message, stack: entry.error.stack }
          : undefined,
      }) + '\n';

    const lineBytes = Buffer.byteLength(line, 'utf-8');

    // Check if rotation is needed
    const today = new Date().toISOString().slice(0, 10);
    if (today !== this.currentDate || this.currentSize + lineBytes > this.maxSize) {
      this.rotate(today);
    }

    if (this.stream) {
      this.stream.write(line);
      this.currentSize += lineBytes;
    }
  }

  /**
   * Flush and close the write stream.
   *
   * @returns Promise that resolves when the stream is fully flushed
   */
  public async flush(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.stream) {
        this.stream.end(() => {
          this.stream = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Ensure the write stream is open and pointing to the correct date file.
   */
  private ensureStream(): void {
    if (this.stream) return;

    const today = new Date().toISOString().slice(0, 10);
    this.currentDate = today;
    this.currentSize = 0;

    const filePath = this.getFilePath(today);
    const dir = path.dirname(filePath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Get existing file size
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      this.currentSize = stat.size;
    }

    this.stream = fs.createWriteStream(filePath, { flags: 'a', encoding: 'utf-8' });
  }

  /**
   * Rotate the log file — close current stream and open a new one.
   * Cleans up old files based on maxFiles configuration.
   *
   * @param date - New date string (YYYY-MM-DD)
   */
  private rotate(date: string): void {
    if (this.stream) {
      this.stream.end();
      this.stream = null;
    }

    this.currentDate = date;
    this.currentSize = 0;

    const filePath = this.getFilePath(date);
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.stream = fs.createWriteStream(filePath, { flags: 'a', encoding: 'utf-8' });

    // Clean up old files
    this.cleanOldFiles(dir);
  }

  /**
   * Get the file path for a given date, appending date suffix.
   *
   * @param date - Date string (YYYY-MM-DD)
   * @returns Full file path with date suffix
   */
  private getFilePath(date: string): string {
    const ext = path.extname(this.config.path);
    const base = this.config.path.slice(0, -ext.length || undefined);
    return `${base}-${date}${ext || '.log'}`;
  }

  /**
   * Remove old rotated log files exceeding maxFiles count.
   *
   * @param dir - Directory containing log files
   */
  private cleanOldFiles(dir: string): void {
    try {
      const basename = path.basename(this.config.path, path.extname(this.config.path));
      const files = fs
        .readdirSync(dir)
        .filter((f) => f.startsWith(basename) && f.includes('-'))
        .sort()
        .reverse();

      // Remove files beyond maxFiles
      for (let i = this.maxFiles; i < files.length; i++) {
        try {
          fs.unlinkSync(path.join(dir, files[i]!));
        } catch {
          // Best-effort cleanup
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  }
}
