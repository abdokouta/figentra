/**
 * @file client.helper.ts
 * @description HTTP request construction and resilient execution helpers for RegistryClientService.
 *
 * Encapsulates URL formatting, authorization headers injection, and exponential-backoff retry logic.
 */

import { Logger } from "@nestjs/common";

/** Error thrown when a Registry Worker request fails after exhausting all retries. */
export class RegistryClientError extends Error {
  constructor(
    message: string,
    /** HTTP status code returned by the upstream endpoint, if any. */
    public readonly status?: number,
    /** Response body payload or upstream error details, if any. */
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "RegistryClientError";
  }
}

/**
 * Normalizes and joins base Registry URL with the specified endpoint path.
 *
 * @param baseUrl - Configured base registry URL.
 * @param path - Relative API endpoint path.
 * @returns Fully qualified endpoint URL.
 */
export function buildRegistryUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/$/, "");
  return `${base}${path}`;
}

/**
 * Constructs standard headers for Registry Worker HTTP requests,
 * injecting the Bearer authorization token if configured.
 *
 * @param token - Optional JWT Bearer token with appropriate registry permissions.
 * @returns Standard HeadersInit object.
 */
export function buildRegistryHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Executes a network fetch request with configurable timeout and exponential backoff retry.
 *
 * @param url - Destination URL.
 * @param init - Request initialization options.
 * @param retries - Maximum retry attempts.
 * @param timeoutMs - Timeout duration per attempt in milliseconds.
 * @param logger - Optional Logger instance for retry diagnostics.
 * @returns Response object on successful network exchange.
 * @throws RegistryClientError if all attempts fail.
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = 3,
  timeoutMs = 10_000,
  logger?: Logger,
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);
      return response;
    } catch (error) {
      clearTimeout(timer);
      lastError = error;

      if (attempt < retries) {
        const delay = 2 ** (attempt - 1) * 250;
        logger?.warn(`Registry request failed (attempt ${attempt}/${retries}). Retrying in ${delay}ms…`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new RegistryClientError(
    `Registry request failed after ${retries} attempts`,
    undefined,
    lastError,
  );
}
