/**
 * @file response-envelope.ts
 * @module @stackra/nestjs-response/core/envelope
 * @description Builder class for constructing standard success response envelopes.
 *   Assembles all envelope fields and produces the final serializable shape.
 */

import type { IResponseEnvelope } from '../interfaces/response-envelope.interface';
import type { IErrorDetail } from '../interfaces/error-detail.interface';

/**
 * Builds a standard success response envelope.
 *
 * Accepts partial configuration via constructor and assembles
 * the complete `IResponseEnvelope` shape via the `build()` method.
 *
 * @typeParam T - The type of the response data payload
 */
export class ResponseEnvelope<T = unknown> {
  /** Whether the operation was successful. */
  private success: boolean = true;

  /** Human-readable message. */
  private message?: string;

  /** Response payload. */
  private data: T;

  /** Additional metadata. */
  private meta?: Record<string, unknown>;

  /** HATEOAS navigation links. */
  private links?: Record<string, string | null>;

  /** Structured error details. */
  private errors?: IErrorDetail[];

  /** Debug information. */
  private debug?: Record<string, unknown>;

  /** ISO timestamp. */
  private timestamp: string;

  /** Request identifier. */
  private requestId?: string;

  /**
   * @param config - Partial envelope configuration to initialize with
   */
  public constructor(
    config: Partial<{
      success: boolean;
      message: string;
      data: T;
      meta: Record<string, unknown>;
      links: Record<string, string | null>;
      errors: IErrorDetail[];
      debug: Record<string, unknown>;
      timestamp: string;
      requestId: string;
    }>
  ) {
    this.success = config.success ?? true;
    this.message = config.message;
    this.data = config.data as T;
    this.meta = config.meta;
    this.links = config.links;
    this.errors = config.errors;
    this.debug = config.debug;
    this.timestamp = config.timestamp ?? new Date().toISOString();
    this.requestId = config.requestId;
  }

  /**
   * Build the final response envelope object.
   *
   * @returns The complete response envelope ready for serialization
   */
  public build(): IResponseEnvelope<T> {
    const envelope: IResponseEnvelope<T> = {
      success: this.success,
      data: this.data,
      timestamp: this.timestamp,
    };

    if (this.message !== undefined) {
      envelope.message = this.message;
    }

    if (this.meta !== undefined) {
      envelope.meta = this.meta;
    }

    if (this.links !== undefined) {
      envelope.links = this.links;
    }

    if (this.errors !== undefined && this.errors.length > 0) {
      envelope.errors = this.errors;
    }

    if (this.debug !== undefined) {
      envelope.debug = this.debug;
    }

    if (this.requestId !== undefined) {
      envelope.request_id = this.requestId;
    }

    return envelope;
  }
}
