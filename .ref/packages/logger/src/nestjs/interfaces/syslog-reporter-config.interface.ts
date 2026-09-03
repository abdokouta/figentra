/**
 * @file syslog-reporter-config.interface.ts
 * @module @stackra/logger/src/interfaces
 * @description ISyslogReporterConfig interface.
 */

/**
 * Syslog reporter configuration options.
 */
export interface ISyslogReporterConfig {
  /** Syslog server hostname. Default: '127.0.0.1'. */
  host?: string;

  /** Syslog server port. Default: 514. */
  port?: number;

  /** Syslog facility code (0-23). Default: 1 (user-level). */
  facility?: number;

  /** Application name for the syslog APP-NAME field. Default: 'stackra'. */
  appName?: string;
}
