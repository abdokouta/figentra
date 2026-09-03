/**
 * @file processor-options.interface.ts
 * @module @stackra/queue/src/interfaces
 * @description ProcessorOptions interface.
 */

/** Options for the @Processor decorator. */
export interface ProcessorOptions {
  /** Queue name this processor handles. */
  queue: string;
  /** Connection name (optional — defaults to module default). */
  connection?: string;
}
