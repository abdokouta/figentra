/**
 * @file syslog.reporter.ts
 * @module @stackra/logger/nestjs/reporters
 * @description Syslog reporter — writes RFC 5424 formatted messages via UDP.
 *   Designed for environments that require centralized syslog aggregation.
 */

import { Injectable } from '@nestjs/common';
import { type ILogReporter, type ILogEntry, ILogLevel } from '@stackra/contracts';
import * as dgram from 'dgram';

import { Reporter } from '../../core/decorators/reporter.decorator';

/**
 * RFC 5424 severity mapping from ILogLevel to syslog severity.
 */
export const SYSLOG_SEVERITY_MAP: Record<ILogLevel, number> = {
  [ILogLevel.FATAL]: 2, // Critical
  [ILogLevel.ERROR]: 3, // Error
  [ILogLevel.WARN]: 4, // Warning
  [ILogLevel.INFO]: 6, // Informational
  [ILogLevel.DEBUG]: 7, // Debug
  [ILogLevel.SILENT]: 7, // Debug (should never be sent)
};

/**
 * Syslog reporter — sends log entries as RFC 5424 messages via UDP.
 *
 * Formats log entries according to RFC 5424 and sends them to a syslog
 * server over UDP. Suitable for environments with centralized log
 * aggregation (rsyslog, syslog-ng, Graylog, etc.).
 *
 * The UDP socket is created lazily on first write and reused across entries.
 * Sending is fire-and-forget — UDP packet loss does not affect application flow.
 *
 * @example
 * ```typescript
 * const syslogReporter = new SyslogReporter({
 *   host: 'syslog.internal.corp',
 *   port: 514,
 *   facility: 1,
 *   appName: 'my-api',
 * });
 * manager.registerReporter(syslogReporter);
 * ```
 */
export @Reporter('syslog')
class SyslogReporter implements ILogReporter {
  /** Reporter identifier. */
  public readonly name = 'syslog';

  /** UDP socket for sending messages. */
  private socket: dgram.Socket | null = null;

  /** Resolved host. */
  private readonly host: string;

  /** Resolved port. */
  private readonly port: number;

  /** Resolved facility code. */
  private readonly facility: number;

  /** Resolved application name. */
  private readonly appName: string;

  /**
   * @param config - Syslog reporter configuration
   */
  public constructor(config: ISyslogReporterConfig = {}) {
    this.host = config.host ?? '127.0.0.1';
    this.port = config.port ?? 514;
    this.facility = config.facility ?? 1;
    this.appName = config.appName ?? 'stackra';
  }

  /**
   * Write a log entry as an RFC 5424 syslog message via UDP.
   *
   * @param entry - Structured log entry
   */
  public write(entry: ILogEntry): void {
    this.ensureSocket();

    const message = this.formatRfc5424(entry);
    const buffer = Buffer.from(message, 'utf-8');

    try {
      this.socket?.send(buffer, 0, buffer.length, this.port, this.host);
    } catch {
      // Fire-and-forget — UDP errors must not affect application
    }
  }

  /**
   * Close the UDP socket.
   *
   * @returns Promise that resolves when the socket is closed
   */
  public async flush(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.socket) {
        this.socket.close(() => {
          this.socket = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Ensure the UDP socket is created.
   */
  private ensureSocket(): void {
    if (this.socket) return;
    this.socket = dgram.createSocket('udp4');
    // Prevent socket from keeping the process alive
    this.socket.unref();
  }

  /**
   * Format a log entry as an RFC 5424 syslog message.
   *
   * Format: `<PRI>VERSION TIMESTAMP HOSTNAME APP-NAME PROCID MSGID SD MSG`
   *
   * @param entry - Log entry to format
   * @returns RFC 5424 formatted string
   */
  private formatRfc5424(entry: ILogEntry): string {
    const severity = SYSLOG_SEVERITY_MAP[entry.level] ?? 6;
    const priority = this.facility * 8 + severity;
    const hostname = '-'; // NILVALUE per RFC 5424
    const procId = (globalThis as any).process?.pid?.toString() ?? '-';
    const msgId = entry.context ?? '-';
    const structuredData = '-'; // No structured data

    const msg = entry.meta ? `${entry.message} ${JSON.stringify(entry.meta)}` : entry.message;

    return `<${priority}>1 ${entry.timestamp} ${hostname} ${this.appName} ${procId} ${msgId} ${structuredData} ${msg}`;
  }
}
