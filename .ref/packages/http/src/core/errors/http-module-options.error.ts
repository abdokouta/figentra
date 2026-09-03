/**
 * @file http-module-options.error.ts
 * @module @stackra/http/errors/http-module-options
 * @description Module-options validation error.
 *
 *   Thrown by `HttpModule.forRoot()` when the configuration is
 *   malformed. Surfaces immediately at bootstrap so misconfigurations
 *   fail loud instead of silently mis-routing requests.
 */

import { HttpError } from "./http.error";

/**
 * Configuration validation error for the HTTP module.
 */
export class HttpModuleOptionsError extends HttpError {
  public override readonly name: string = "HttpModuleOptionsError";
  public override readonly code: string = "HTTP_MODULE_OPTIONS_ERROR";
}
