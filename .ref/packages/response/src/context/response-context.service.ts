/**
 * @file response-context.service.ts
 * @module @stackra/nestjs-response/core/context
 * @description Request-scoped service that holds per-request context data.
 *   Provides request ID, timing information, and trace correlation for responses.
 */

import { IInjectable, IScope } from '@nestjs/common';
import { randomUUID } from 'crypto';

/**
 * Request-scoped context for response generation.
 *
 * Automatically generates a unique request ID and records the start time
 * for each incoming request. Used by interceptors and filters to enrich
 * response envelopes with tracing and timing data.
 */
@IInjectable({ scope: IScope.REQUEST })
export class ResponseContext {
  /** Unique identifier for this request. */
  public readonly requestId: string;

  /** Timestamp (ms) when the request started processing. */
  public readonly startTime: number;

  /** Optional distributed trace ID for cross-service correlation. */
  public traceId?: string;

  public constructor() {
    this.requestId = randomUUID();
    this.startTime = Date.now();
  }

  /**
   * Calculate elapsed time since request start.
   *
   * @returns Elapsed time in milliseconds
   */
  public getElapsedMs(): number {
    return Date.now() - this.startTime;
  }
}
