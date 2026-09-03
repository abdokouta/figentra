/**
 * @file http.config.ts
 * @module @stackra/http/config
 * @description Consumer template for the HTTP module.
 */

import { env, registerAs } from "@stackra/config";
import { HTTP_CONFIG, type IHttpModuleOptions } from "@stackra/contracts";

export const httpConfig = registerAs<IHttpModuleOptions>(HTTP_CONFIG, () => ({
  /*
  |--------------------------------------------------------------------------
  | Default Connection
  |--------------------------------------------------------------------------
  |
  | Named connection used by `HttpService.request(...)` when the call
  | site does not specify one. Consumers that talk to a single
  | backend leave this at `"api"`.
  |
  */
  default: env("HTTP_DEFAULT", "api"),

  /*
  |--------------------------------------------------------------------------
  | HTTP Connections
  |--------------------------------------------------------------------------
  |
  | Every named connection carries its own `baseURL`, timeout, and
  | default header set. Add a new key here to reach a second backend
  | (auth server, third-party API) from the same client.
  |
  */
  connections: {
    api: {
      baseURL: env("API_BASE_URL", "/"),
      timeout: env.number("API_TIMEOUT_MS", 30_000),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    },
  },
}));
