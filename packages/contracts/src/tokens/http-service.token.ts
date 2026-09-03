/**
 * @file http-service.token.ts
 * @module @stackra/contracts/tokens
 * @description DI token for the HTTP service.
 */

/** Injection token for `IHttpService`. */
export const HTTP_SERVICE: unique symbol = Symbol.for("HTTP_SERVICE");
