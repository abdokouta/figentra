/**
 * @file index.ts
 * @module @stackra/http
 * @description `@stackra/http` — multi-driver HTTP client.
 *
 *   Public surface:
 *
 *   - `HttpModule.forRoot()` / `forRootAsync()` / `forFeature()` /
 *     `forFeatureMiddleware()` — DI module entry points.
 *   - `HttpManager`, `HttpClient` — concrete services. Most consumers
 *     inject the contracts (`IHttpManager`, `IHttpClient`) through
 *     `@InjectHttp()` / `@InjectHttpManager()`.
 *   - `MiddlewarePipeline`, `InterceptorPipeline` — pipeline executors.
 *   - `MiddlewareRegistry`, `InterceptorRegistry` — per-connection
 *     registries.
 *   - `FetchConnector` — default driver (browser-native + zero-dep).
 *   - `AxiosConnector` — opt-in via `driver: "axios"` on the
 *     connection config + `axios` installed as a peer dep. The
 *     `@stackra/http/fetch` subpath stays for back-compat.
 *   - 5 built-in middleware: `AuthMiddleware`, `RateLimitMiddleware`,
 *     `CircuitBreakerMiddleware`, `DeduplicationMiddleware`,
 *     `ProgressMiddleware`.
 *   - 6 built-in interceptors: `ErrorNormalizerInterceptor`,
 *     `RetryInterceptor`, `LoggingInterceptor`, `CacheInterceptor`,
 *     `TransformInterceptor`, `MetricsInterceptor`.
 *   - 4 support services: `TokenBucketService`,
 *     `CircuitBreakerService`, `MetricsCollectorService`,
 *     `UploadService`.
 *   - 5 stream parsers: `SseStreamParser`, `NdjsonStreamParser`,
 *     `JsonStreamParser`, `TextStreamParser`, `BinaryStreamParser`.
 *   - Decorators: `@HttpMiddleware`, `@HttpInterceptor`, `@InjectHttp`,
 *     `@InjectHttpManager`.
 *   - Utilities: `defineConfig`, `composeBaseURL`, `CaseConverter`,
 *     `DateParser`.
 *
 *   Cross-package contracts (interfaces, tokens, enums, events, types)
 *   all live in `@stackra/contracts`.
 *
 *   @example
 *   ```typescript
 *   import { Module } from '@stackra/container';
 *   import { HttpModule } from '@stackra/http';
 *
 *   @Module({
 *     imports: [
 *       HttpModule.forRoot({
 *         default: 'api',
 *         connections: {
 *           api:    { baseURL: 'https://api.example.com', timeout: 10_000 },
 *           auth:   { baseURL: 'https://auth.example.com', timeout: 5_000 },
 *           uploads: { baseURL: 'https://uploads.example.com', timeout: 120_000 },
 *         },
 *       }),
 *     ],
 *   })
 *   export class AppModule {}
 *
 *   @Injectable()
 *   class UserService {
 *     public constructor(@InjectHttp() private readonly api: IHttpClient) {}
 *
 *     public async getUsers(): Promise<IUser[]> {
 *       const response = await this.api.get<IUser[]>('/users');
 *       return response.data;
 *     }
 *   }
 *   ```
 */

// ============================================================================
// Module
// ============================================================================
export { HttpModule } from "./http.module";

// ============================================================================
// Services
// ============================================================================
export {
  HttpClient,
  HttpManager,
  MiddlewarePipeline,
  InterceptorPipeline,
  TokenBucketService,
  CircuitBreakerService,
  MetricsCollectorService,
  UploadService,
} from "./services";
export type { IHttpClientDeps } from "./services";

// ============================================================================
// Connectors
// ============================================================================
// Both connectors ship from the root entry since 1.1.0. `FetchConnector` is
// the default driver (browser-native + zero-dep); `AxiosConnector` is opt-in
// via `driver: "axios"` on the connection config + `axios` installed as a
// peer. The `@stackra/http/fetch` subpath stays for backward compat.
export { AxiosConnector, FetchConnector } from "./connectors";

// ============================================================================
// Registries
// ============================================================================
export { MiddlewareRegistry, InterceptorRegistry } from "./registries";

// ============================================================================
// Middleware (pre-handler)
// ============================================================================
export {
  AuthMiddleware,
  RateLimitMiddleware,
  CircuitBreakerMiddleware,
  DeduplicationMiddleware,
  ProgressMiddleware,
} from "./middleware";

// ============================================================================
// Interceptors (wrap-handler)
// ============================================================================
export {
  ErrorNormalizerInterceptor,
  RetryInterceptor,
  LoggingInterceptor,
  CacheInterceptor,
  TransformInterceptor,
  MetricsInterceptor,
} from "./interceptors";

// ============================================================================
// Parsers (streaming)
// ============================================================================
export {
  SseStreamParser,
  NdjsonStreamParser,
  JsonStreamParser,
  TextStreamParser,
  BinaryStreamParser,
  createStreamParser,
} from "./parsers";
export type { IStreamParser, ISseParserOptions } from "./parsers";

// ============================================================================
// Decorators
// ============================================================================
// `InjectHttp` moved to `@stackra/decorators/http` per the 2026-07
// promotion sweep. Consumers import from there directly.
export {
  HttpMiddleware,
  HttpInterceptor,
  InjectHttpManager,
  getHttpMiddlewareMetadata,
  getHttpInterceptorMetadata,
} from "./decorators";

// ============================================================================
// Constants (decorator metadata + defaults)
// ============================================================================
export {
  HTTP_MIDDLEWARE_METADATA,
  HTTP_INTERCEPTOR_METADATA,
  DEFAULT_RATE_LIMIT,
  DEFAULT_CIRCUIT_BREAKER,
  DEFAULT_MAX_RETRIES,
  DEFAULT_RETRY_BACKOFF,
  DEFAULT_TIMEOUT_MS,
} from "./constants";

// ============================================================================
// Errors
// ============================================================================
export {
  HttpError,
  HttpModuleOptionsError,
  HttpDriverError,
  CircuitBreakerOpenError,
  RateLimitExceededError,
  HttpCacheError,
  HttpTransformError,
  HttpStreamError,
} from "./errors";

// ============================================================================
// Utilities
// ============================================================================
export { CaseConverter, DateParser, composeBaseURL } from "./utils";
