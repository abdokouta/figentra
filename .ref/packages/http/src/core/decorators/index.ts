/**
 * @file index.ts
 * @module @stackra/http/decorators
 * @description Decorators barrel.
 */

export {
  HttpMiddleware,
  getHttpMiddlewareMetadata,
} from "./http-middleware.decorator";
export {
  HttpInterceptor,
  getHttpInterceptorMetadata,
} from "./http-interceptor.decorator";
// `InjectHttp` moved to `@stackra/decorators/http` per the promotion
// sweep (contracts-and-decorators-promotion.md §Test A — 11+
// consumer packages). Consumers import from there directly.
export { InjectHttpManager } from "./inject-http-manager.decorator";
