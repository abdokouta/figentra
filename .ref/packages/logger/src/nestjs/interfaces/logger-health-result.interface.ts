/**
 * @file logger-health-result.interface.ts
 * @module @stackra/logger/src/interfaces
 * @description ILoggerHealthResult interface.
 */

/**
 * Logger health check result.
 */
export interface ILoggerHealthResult {
  /** Overall health status. */
  status: 'healthy' | 'degraded' | 'unhealthy';

  /** Detailed information about the logger state. */
  details: {
    /** Number of registered reporters. */
    reporterCount: number;

    /** Names of registered reporters. */
    reporters: string[];

    /** Default channel name. */
    defaultChannel: string;

    /** Number of configured channels. */
    channelCount: number;

    /** Timestamp of the last known error (ISO string, or null). */
    lastErrorTime: string | null;
  };
}
