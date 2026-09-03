/**
 * @file response.builder.ts
 * @module @stackra/nestjs-response/core/builder
 * @description Fluent builder for constructing API responses.
 *   Provides static factory methods for common response patterns and a
 *   chainable API for customizing envelope content, status codes, and headers.
 */

import type { IResponseEnvelope } from '../interfaces/response-envelope.interface';
import type { IErrorDetail } from '../interfaces/error-detail.interface';
import type { IResponsePreset } from '../presets';
import type { IResponseTransformer } from '../pipeline/transformer.interface';

// ============================================================================
// Types
// ============================================================================

/**
 * Paginated result shape expected by the builder.
 *
 * @typeParam D - The type of items in the paginated collection
 */
interface IPaginatedResult<D> {
  data: D[];
  meta: Record<string, unknown>;
  links?: Record<string, string | null>;
}

// ============================================================================
// Builder
// ============================================================================

/**
 * Fluent builder for constructing standardized API responses.
 *
 * Provides static factory methods for common patterns (success, error, created,
 * noContent, paginated) and a chainable instance API for customizing the
 * response envelope, HTTP status, and headers.
 *
 * @typeParam T - The type of the response data payload
 *
 * @example
 * ```typescript
 * const response = ResponseBuilder.success(user)
 *   .withMessage('User retrieved successfully')
 *   .withLink('self', '/api/users/123')
 *   .build();
 * ```
 */
export class ResponseBuilder<T = unknown> {
  /** Response data payload. */
  private data: T | undefined;

  /** Human-readable message. */
  private message?: string;

  /** Additional metadata. */
  private meta?: Record<string, unknown>;

  /** HATEOAS links. */
  private links?: Record<string, string | null>;

  /** Structured errors. */
  private errors?: IErrorDetail[];

  /** HTTP status code. */
  private status: number = 200;

  /** Response headers. */
  private headers: Record<string, string> = {};

  /** Whether the operation was successful. */
  private success: boolean = true;

  /** Response transformers to apply. */
  private transformers: IResponseTransformer[] = [];

  // ==========================================================================
  // Static Factory Methods
  // ==========================================================================

  /**
   * Create a success response builder.
   *
   * @param data - Optional response payload
   * @returns A new builder configured for success
   */
  public static success<D>(data?: D): ResponseBuilder<D> {
    const builder = new ResponseBuilder<D>();
    builder.data = data;
    builder.success = true;
    builder.status = 200;
    return builder;
  }

  /**
   * Create an error response builder.
   *
   * @param message - Error message
   * @param code - Optional machine-readable error code
   * @returns A new builder configured for error
   */
  public static error(message: string, code?: string): ResponseBuilder<never> {
    const builder = new ResponseBuilder<never>();
    builder.success = false;
    builder.message = message;
    builder.status = 400;
    builder.errors = [{ code: code ?? 'ERROR', message }];
    return builder;
  }

  /**
   * Create a 201 Created response builder.
   *
   * @param data - The created resource
   * @param message - Optional success message
   * @returns A new builder configured for resource creation
   */
  public static created<D>(data: D, message?: string): ResponseBuilder<D> {
    const builder = new ResponseBuilder<D>();
    builder.data = data;
    builder.success = true;
    builder.status = 201;
    builder.message = message ?? 'Resource created successfully';
    return builder;
  }

  /**
   * Create a 204 No Content response builder.
   *
   * @returns A new builder configured for no content
   */
  public static noContent(): ResponseBuilder<void> {
    const builder = new ResponseBuilder<void>();
    builder.success = true;
    builder.status = 204;
    return builder;
  }

  /**
   * Create a paginated response builder from a pagination result.
   *
   * @param result - The paginated result containing data, meta, and links
   * @returns A new builder configured for paginated responses
   */
  public static paginated<D>(result: IPaginatedResult<D>): ResponseBuilder<D[]> {
    const builder = new ResponseBuilder<D[]>();
    builder.data = result.data;
    builder.meta = result.meta;
    builder.links = result.links;
    builder.success = true;
    builder.status = 200;
    return builder;
  }

  // ==========================================================================
  // Chainable Instance Methods
  // ==========================================================================

  /**
   * Set the response data payload.
   *
   * @param data - The data to include in the response
   * @returns This builder for chaining
   */
  public withData(data: T): this {
    this.data = data;
    return this;
  }

  /**
   * Set the response message.
   *
   * @param message - Human-readable message
   * @returns This builder for chaining
   */
  public withMessage(message: string): this {
    this.message = message;
    return this;
  }

  /**
   * Set additional metadata on the response.
   *
   * @param meta - Key-value metadata object
   * @returns This builder for chaining
   */
  public withMeta(meta: Record<string, unknown>): this {
    this.meta = { ...(this.meta ?? {}), ...meta };
    return this;
  }

  /**
   * Add a single HATEOAS link.
   *
   * @param rel - Link relation name
   * @param href - Link URL
   * @returns This builder for chaining
   */
  public withLink(rel: string, href: string): this {
    if (!this.links) {
      this.links = {};
    }
    this.links[rel] = href;
    return this;
  }

  /**
   * Set multiple HATEOAS links at once.
   *
   * @param links - Map of relation names to URLs
   * @returns This builder for chaining
   */
  public withLinks(links: Record<string, string | null>): this {
    this.links = { ...(this.links ?? {}), ...links };
    return this;
  }

  /**
   * Set structured error details.
   *
   * @param errors - Array of error detail objects
   * @returns This builder for chaining
   */
  public withErrors(errors: IErrorDetail[]): this {
    this.errors = errors;
    return this;
  }

  /**
   * Set the HTTP status code.
   *
   * @param status - HTTP status code
   * @returns This builder for chaining
   */
  public withStatus(status: number): this {
    this.status = status;
    return this;
  }

  /**
   * Add a single response header.
   *
   * @param name - Header name
   * @param value - Header value
   * @returns This builder for chaining
   */
  public withHeader(name: string, value: string): this {
    this.headers[name] = value;
    return this;
  }

  /**
   * Set multiple response headers at once.
   *
   * @param headers - Map of header names to values
   * @returns This builder for chaining
   */
  public withHeaders(headers: Record<string, string>): this {
    this.headers = { ...this.headers, ...headers };
    return this;
  }

  /**
   * Set the ETag header for cache validation.
   *
   * @param etag - ETag value
   * @returns This builder for chaining
   */
  public withETag(etag: string): this {
    this.headers['ETag'] = etag;
    return this;
  }

  /**
   * Apply a response preset configuration.
   *
   * @param preset - The preset to apply
   * @returns This builder for chaining
   */
  public withPreset(preset: IResponsePreset): this {
    if (preset.hints) {
      const headers = preset.hints['headers'] as Record<string, string> | undefined;
      if (headers) {
        this.headers = { ...this.headers, ...headers };
      }
    }
    if (preset.transformers) {
      const instances = preset.transformers.map((Ctor) => new Ctor());
      this.transformers = [...this.transformers, ...instances];
    }
    return this;
  }

  /**
   * Add response transformers to the pipeline.
   *
   * @param transformers - Array of transformers to apply
   * @returns This builder for chaining
   */
  public through(transformers: IResponseTransformer[]): this {
    this.transformers = [...this.transformers, ...transformers];
    return this;
  }

  /**
   * Build the final response object.
   *
   * Assembles the envelope, applies transformers, and returns the
   * complete response with status code and headers.
   *
   * @returns Object containing the envelope, HTTP status, and headers
   */
  public build(): {
    envelope: IResponseEnvelope<T>;
    status: number;
    headers: Record<string, string>;
  } {
    let envelope: IResponseEnvelope<T> = {
      success: this.success,
      data: this.data as T,
      timestamp: new Date().toISOString(),
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

    // Apply transformers
    for (const transformer of this.transformers) {
      envelope = transformer.transform(envelope) as IResponseEnvelope<T>;
    }

    return {
      envelope,
      status: this.status,
      headers: this.headers,
    };
  }
}
