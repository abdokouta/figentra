/**
 * @file deliver-job-data.interface.ts
 * @module @stackra/webhook/src/interfaces
 * @description IDeliverJobData interface.
 */

/**
 * Shape of the job data enqueued by WebhookDispatcher.
 */
export interface IDeliverJobData {
  /** Target subscription UUID. */
  subscriptionId: string;

  /** Correlation event ID (UUID). */
  eventId: string;

  /** Wire-format event name. */
  eventName: string;

  /** Event version string (nullable). */
  eventVersion: string | null;

  /** Serialized event payload. */
  payload: Record<string, any>;
}
