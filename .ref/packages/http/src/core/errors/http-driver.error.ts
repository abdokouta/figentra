/**
 * @file http-driver.error.ts
 * @module @stackra/http/errors/http-driver
 * @description Driver resolution error.
 *
 *   Thrown when the manager cannot resolve a connector for a driver
 *   name — typo, missing peer dependency, or `forFeature(driver, ...)`
 *   was never called.
 */

import { HttpError } from "./http.error";

/**
 * Driver resolution error.
 */
export class HttpDriverError extends HttpError {
  public override readonly name: string = "HttpDriverError";
  public override readonly code: string = "HTTP_DRIVER_ERROR";
}
