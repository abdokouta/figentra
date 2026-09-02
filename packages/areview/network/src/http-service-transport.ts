/**
 * @file http-service-transport.ts
 * @description Production HTTP transport for Figentra service clients.
 */

import type {
  ServiceRequestOptions,
  ServiceTransport,
} from "./service-transport.interface";

/** Structured error returned when an upstream service rejects a request. */
export class ServiceTransportError extends Error {
  /**
   * @param status - Upstream HTTP status.
   * @param service - Logical service identifier.
   * @param message - Safe error message.
   * @param requestId - Correlation request identifier.
   */
  public constructor(
    public readonly status: number,
    public readonly service: string,
    message: string,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ServiceTransportError";
  }
}

/** Configuration for a production HTTP service transport. */
export interface HttpServiceTransportOptions {
  /** Logical service identifier used for diagnostics. */
  readonly service: string;
  /** Absolute service origin. */
  readonly baseUrl: string;
  /** Request timeout in milliseconds. */
  readonly timeoutMs: number;
  /** Supplies a short-lived service token when one is required. */
  readonly getAccessToken?: () => Promise<string> | string;
  /** Maximum number of attempts for retryable idempotent requests. */
  readonly maxRetries?: number;
}

/** Production transport shared by all SDK service clients. */
export class HttpServiceTransport implements ServiceTransport {
  /**
   * @param options - Validated transport configuration.
   */
  public constructor(private readonly options: HttpServiceTransportOptions) {
    const origin = new URL(options.baseUrl);
    if (origin.protocol !== "https:") {
      throw new Error("Service transport requires HTTPS upstreams.");
    }
    if (!Number.isInteger(options.timeoutMs) || options.timeoutMs < 1) {
      throw new Error("Service transport timeout must be a positive integer.");
    }
  }

  /**
   * Performs a request with bounded timeout and safe retry semantics.
   *
   * @param method - HTTP method.
   * @param path - Relative path beginning with `/`.
   * @param options - Headers, body and cancellation signal.
   */
  public async request<TResponse>(
    method: string,
    path: string,
    options: ServiceRequestOptions = {},
  ): Promise<TResponse> {
    if (!path.startsWith("/")) {
      throw new Error("Service transport paths must begin with '/'.");
    }

    const normalizedMethod = method.toUpperCase();
    const retryable = normalizedMethod === "GET" || normalizedMethod === "HEAD" || normalizedMethod === "OPTIONS";
    const attempts = retryable ? Math.max(0, this.options.maxRetries ?? 1) + 1 : 1;
    let lastError: unknown;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        return await this.execute<TResponse>(normalizedMethod, path, options);
      } catch (error) {
        lastError = error;
        if (!retryable || !isRetryable(error) || attempt + 1 >= attempts) break;
        await new Promise((resolve) => setTimeout(resolve, 100 * 2 ** attempt));
      }
    }

    throw lastError instanceof Error ? lastError : new Error("Service request failed.");
  }

  /** Executes one request without retry recursion. */
  private async execute<TResponse>(
    method: string,
    path: string,
    options: ServiceRequestOptions,
  ): Promise<TResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs);
    const signal = options.signal
      ? AbortSignal.any([options.signal, controller.signal])
      : controller.signal;

    try {
      const token = this.options.getAccessToken
        ? await this.options.getAccessToken()
        : undefined;
      const headers = new Headers(options.headers);
      headers.set("accept", "application/json");
      if (token) headers.set("authorization", `Bearer ${token}`);
      if (options.body !== undefined) headers.set("content-type", "application/json");

      const response = await fetch(new URL(path, this.options.baseUrl), {
        method,
        signal,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });

      const requestId = response.headers.get("x-request-id") ?? undefined;
      const contentType = response.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        throw new ServiceTransportError(
          response.status,
          this.options.service,
          typeof payload === "object" && payload !== null && "message" in payload
            ? String(payload.message)
            : `Upstream service returned HTTP ${response.status}.`,
          requestId,
        );
      }

      return payload as TResponse;
    } finally {
      clearTimeout(timer);
    }
  }
}

/** Returns true only for failures safe to retry for idempotent requests. */
function isRetryable(error: unknown): boolean {
  if (error instanceof ServiceTransportError) {
    return error.status === 408 || error.status === 425 || error.status === 429 || error.status >= 500;
  }
  return true;
}
