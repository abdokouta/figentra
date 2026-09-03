/**
 * @file http.mjs
 * @module scripts/_lib/http
 * @description Thin fetch wrapper — retries, JSON parsing, auth header
 *   merging, timeout, error normalization.
 *
 *   Uses Node's native `fetch` (Node 18+). Every non-2xx response throws
 *   a `HttpError` with `.status`, `.body`, `.url` for triage.
 *
 * ## Usage
 *
 * ```javascript
 * import { httpJson, HttpError } from "./_lib/http.mjs";
 *
 * const projects = await httpJson({
 *   url: "https://gitlab.com/api/v4/projects",
 *   headers: { "PRIVATE-TOKEN": token },
 *   query: { per_page: 100 },
 * });
 * ```
 *
 * ## Retries
 *
 * `retries: 3` retries on network errors + 5xx status codes with
 * exponential backoff (200ms, 400ms, 800ms). 4xx errors are NOT
 * retried — they're client bugs, retrying doesn't help.
 */
import { log } from "./log.mjs";

/**
 * @typedef {object} HttpOptions
 * @property {string}                     url
 * @property {"GET"|"POST"|"PUT"|"DELETE"|"PATCH"|"HEAD"} [method]  Default GET.
 * @property {Record<string, string>}     [headers]
 * @property {Record<string, string | number | boolean>} [query]   URL query params.
 * @property {unknown}                    [body]      JSON-encoded if not a string/Buffer.
 * @property {number}                     [timeoutMs] Default 30000.
 * @property {number}                     [retries]   Default 3.
 * @property {boolean}                    [expectJson] Default true.
 */

/**
 * Error raised on non-2xx HTTP responses.
 */
export class HttpError extends Error {
  /**
   * @param {number} status
   * @param {string} statusText
   * @param {string} url
   * @param {string} body
   */
  constructor(status, statusText, url, body) {
    super(`HTTP ${status} ${statusText} @ ${url}\n  body: ${body.slice(0, 400)}`);
    this.name = "HttpError";
    this.status = status;
    this.statusText = statusText;
    this.url = url;
    this.body = body;
  }
}

/**
 * Send a request; return the raw `Response` (for callers that need it).
 * Retries on network + 5xx; throws HttpError on 4xx or exhausted retries.
 *
 * @param {HttpOptions} options
 * @returns {Promise<Response>}
 */
export async function httpFetch(options) {
  const {
    url: base,
    method = "GET",
    headers = {},
    query,
    body,
    timeoutMs = 30_000,
    retries = 3,
  } = options;

  // Build URL with query params.
  const url = query
    ? `${base}?${new URLSearchParams(Object.fromEntries(Object.entries(query).map(([k, v]) => [k, String(v)]))).toString()}`
    : base;

  // Encode body if needed.
  let requestBody = body;
  const requestHeaders = { ...headers };
  if (body !== undefined && typeof body !== "string" && !(body instanceof ArrayBuffer)) {
    requestBody = JSON.stringify(body);
    if (!requestHeaders["Content-Type"]) {
      requestHeaders["Content-Type"] = "application/json";
    }
  }

  /** @type {Error | null} */
  let lastErr = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    // AbortController for timeout.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      log.debug(`http ${method} ${url}`, attempt > 0 ? `retry ${attempt}` : "");

      const res = await fetch(url, {
        method,
        headers: requestHeaders,
        body: /** @type {BodyInit | null | undefined} */ (requestBody),
        signal: controller.signal,
      });
      clearTimeout(timer);

      // 4xx = client bug, don't retry.
      if (res.status >= 400 && res.status < 500) {
        const bodyText = await res.text();
        throw new HttpError(res.status, res.statusText, url, bodyText);
      }

      // 5xx = server; retry with backoff.
      if (res.status >= 500 && attempt < retries) {
        const wait = 200 * 2 ** attempt;
        log.warn(`http ${res.status} @ ${url} — retrying in ${wait}ms`);
        await sleep(wait);
        continue;
      }

      // 5xx exhausted.
      if (res.status >= 500) {
        const bodyText = await res.text();
        throw new HttpError(res.status, res.statusText, url, bodyText);
      }

      return res;
    } catch (err) {
      clearTimeout(timer);
      // HttpError (4xx) — never retry, rethrow.
      if (err instanceof HttpError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      // Network / abort — retry with backoff.
      lastErr = /** @type {Error} */ (err);
      if (attempt < retries) {
        const wait = 200 * 2 ** attempt;
        log.warn(`http network error @ ${url} (${lastErr.message}) — retrying in ${wait}ms`);
        await sleep(wait);
        continue;
      }
      throw lastErr;
    }
  }

  // Loop exited without returning — theoretically unreachable.
  throw lastErr ?? new Error(`http failed: ${url}`);
}

/**
 * Send a request and parse the response as JSON.
 *
 * @template T
 * @param {HttpOptions} options
 * @returns {Promise<T>}
 */
export async function httpJson(options) {
  const res = await httpFetch(options);
  const text = await res.text();
  if (!text) return /** @type {T} */ (null);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`invalid JSON from ${options.url}: ${text.slice(0, 200)}`);
  }
}

/**
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
