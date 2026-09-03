/**
 * @file funnel-builder.interface.ts
 * @module @stackra/redis/src/interfaces
 * @description IFunnelBuilder interface.
 */

/**
 * Fluent builder interface for concurrency limiting.
 */
export interface IFunnelBuilder {
  /** Set the maximum number of concurrent slots. */
  limit(slots: number): this;

  /** Set the TTL for acquired slots (auto-release on crash). */
  releaseAfter(seconds: number): this;

  /** Set the maximum wait time for a slot. */
  block(seconds: number): this;

  /** Set the sleep interval between retries. */
  sleep(ms: number): this;

  /** Execute the callback within the concurrency limit. */
  then<T>(callback: () => Promise<T> | T, failure?: (error: Error) => T): Promise<T>;
}
