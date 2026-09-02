/**
 * @file service-transport.interface.ts
 * @description Framework-neutral authenticated HTTP transport contract.
 */

/** Request options accepted by a service transport. */
export interface ServiceRequestOptions {
  /** HTTP headers to propagate to the upstream service. */
  readonly headers?: Readonly<Record<string, string>>;
  /** Optional JSON request body. */
  readonly body?: unknown;
  /** Abort signal for caller-controlled cancellation. */
  readonly signal?: AbortSignal;
}

/** Executes requests against an internal Figentra service. */
export interface ServiceTransport {
  /**
   * Performs one authenticated service request.
   *
   * @param method - HTTP method.
   * @param path - Service-relative path.
   * @param options - Request metadata and body.
   */
  request<TResponse>(
    method: string,
    path: string,
    options?: ServiceRequestOptions,
  ): Promise<TResponse>;
}
