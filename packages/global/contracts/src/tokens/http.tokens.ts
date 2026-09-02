/**
 * @file http.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the `@stackra/http` runtime + the
 *   per-connection token utility that decorators + the module use.
 *
 *   Every token uses `Symbol.for(...)` so the same identity is
 *   observed across module realms.
 */

/**
 * DI token for the merged `IHttpModuleOptions`.
 */
export const HTTP_CONFIG = "http" as const;

/**
 * DI token for the `HttpManager` — the workspace's
 * `MultipleInstanceManager<IHttpClient>` that owns every named
 * connection.
 */
export const HTTP_MANAGER = Symbol.for("HTTP_MANAGER");

/**
 * DI token for the app's default `IHttpClient` — a workspace-wide
 * fixed symbol that `HttpModule.forRoot()` ALWAYS registers, aliasing
 * whatever the app chose as its default connection.
 *
 * See `getHttpConnectionToken()` below for how the no-arg call routes
 * to this token.
 */
export const HTTP_CLIENT = Symbol.for("HTTP_CLIENT");

/**
 * Alias for {@link HTTP_CLIENT}. Kept as a separate export because
 * some consumers reference the default-connection semantic
 * explicitly (e.g. `@InjectHttp()` decorator) while others reference
 * the "the app's HTTP client" semantic. Both mean the same thing.
 */
export const DEFAULT_HTTP_CONNECTION_TOKEN = HTTP_CLIENT;

/**
 * Token for an optional access-token provider used by `AuthMiddleware`.
 *
 * Consumers register a provider exposing `getAccessToken()` / `refresh()`
 * under this token to enable bearer-token injection + refresh-on-401.
 */
export const HTTP_TOKEN_PROVIDER = Symbol.for("HTTP_TOKEN_PROVIDER");

/**
 * Build the DI injection token for an HTTP connection.
 *
 * ## Default-connection semantics — the no-arg call
 *
 * When called with NO argument, returns {@link HTTP_CLIENT} (aliased
 * as `DEFAULT_HTTP_CONNECTION_TOKEN` above) — the workspace-wide
 * fixed symbol every `HttpModule.forRoot()` registers unconditionally,
 * mapping to whatever the app chose as its `config.default`
 * connection.
 *
 * This distinguishes two different meanings of "default":
 *
 * - **The literal string `"default"`** — a connection LITERALLY
 *   named `"default"` in `config.connections`. Rare — most apps
 *   name their connections after the API they hit (`api`, `auth`,
 *   `billing`, etc.).
 * - **The app's chosen default connection** — whatever
 *   `config.default` points at. Every `HttpModule.forRoot()`
 *   registers `HTTP_CLIENT` as an alias for that connection, so
 *   `@InjectHttp()` (no arg) always resolves cleanly regardless of
 *   what the app's default connection is named.
 *
 * The old behaviour (`name = "default"` fallback) required every
 * app to declare `connections.default` LITERALLY, which contradicted
 * the workspace's canonical shape of naming connections after their
 * remote (`config.default: "api"` + `connections: { api: {...} }`).
 *
 * ## Named connections
 *
 * When called with a name, returns a stable `Symbol.for()` identity
 * so the same name from different module loads resolves to the same
 * token. Mirrors `getQueueConnectionToken()` and
 * `getRealtimeConnectionToken()`.
 *
 * @param name - Connection name from `IHttpModuleOptions.connections`.
 *   Omit to get the app's default-connection token.
 * @returns The connection's DI token.
 *
 * @example
 * ```typescript
 * getHttpConnectionToken();         // HTTP_CLIENT (workspace-wide default)
 * getHttpConnectionToken("api");    // Symbol.for("HTTP_CONNECTION_api")
 * getHttpConnectionToken("auth");   // Symbol.for("HTTP_CONNECTION_auth")
 * ```
 */
export const getHttpConnectionToken = (name?: string): symbol =>
  name === undefined ? HTTP_CLIENT : Symbol.for(`HTTP_CONNECTION_${name}`);
