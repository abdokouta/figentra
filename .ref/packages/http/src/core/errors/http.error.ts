/**
 * @file http.error.ts
 * @module @stackra/http/errors/http
 * @description Base error class for the HTTP package.
 *
 *   Every error raised by `@stackra/http` extends this class so a
 *   single `instanceof HttpError` check identifies any failure inside
 *   the package, regardless of the specific subclass.
 */

import { StackraError } from "@stackra/support";
/**
 * Base error for the HTTP package.
 */
export class HttpError extends StackraError {
  /** Error name visible in stack traces. */

  /** Machine-readable error code. */

  /** Optional underlying cause. */

  /**
   * @param message - Human-readable message.
   * @param cause   - Optional underlying error.
   */
  public constructor(message: string, cause?: Error) {
    super(message, { code: "HTTP_ERROR", cause });
  }
}
