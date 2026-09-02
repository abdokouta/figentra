/**
 * @file versioning-module-options.interface.ts
 * @module @stackra/contracts/interfaces/versioning
 * @description Options bag for `VersioningModule.forRoot(...)`.
 *
 *   Consumers author a `registerAs<IVersioningModuleOptions>(VERSIONING_CONFIG, () => ({...}))`
 *   factory in their `src/config/versioning.config.ts` per ADR-0063.
 *   `VersioningModule.forRoot()` reads the resolved options from DI
 *   at bootstrap and binds them under `VERSIONING_CONFIG`.
 */

import type { VersioningStrategy } from "./versioning-strategy.type";

/**
 * Per-connection versioning override. Lets different backends served
 * by the same app speak different default versions — the SDUI
 * connection might stay on v1 while the primary API is on v2.
 */
export interface IConnectionVersioningOptions {
  /**
   * Version advertised on requests through this connection when the
   * per-request `apiVersion` isn't set. Falls back to
   * `IVersioningModuleOptions.default` when omitted.
   */
  readonly default?: string;

  /**
   * Strategy for advertising the version on this connection.
   * Falls back to `IVersioningModuleOptions.strategy` when omitted.
   */
  readonly strategy?: VersioningStrategy;
}

/**
 * Deprecation-logging configuration. When enabled, the versioning
 * response interceptor writes a log line every time a deprecated
 * endpoint responds — level configurable, defaults to `"warn"`.
 */
export interface IDeprecationLogOptions {
  /**
   * When `true`, log every deprecated hit. Defaults to `true`.
   */
  readonly enabled?: boolean;

  /**
   * Log level for the deprecation hit. Defaults to `"warn"`.
   */
  readonly threshold?: "debug" | "info" | "warn" | "error";
}

/**
 * Options accepted by `VersioningModule.forRoot(...)`.
 */
export interface IVersioningModuleOptions {
  /**
   * The default version stamped on every outgoing request when
   * neither the per-connection default nor the per-request
   * override is set. Format matches the backend's supported
   * versions (typically `"1.0"`, `"2.0"`, ...).
   *
   * @default "1.0"
   */
  readonly default?: string;

  /**
   * How the version reaches the server. Matches the backend
   * `stackra/versioning` wrapper's detection order — the frontend
   * picks ONE strategy per app.
   *
   * @default "header"
   */
  readonly strategy?: VersioningStrategy;

  /**
   * Header name for the `header` strategy. Defaults to
   * `"X-API-Version"` — matches the backend's default
   * `API_VERSION_HEADER_NAME`.
   */
  readonly headerName?: string;

  /**
   * Query-string key for the `query` strategy. Defaults to
   * `"api-version"` — matches the backend's default
   * `API_VERSION_QUERY_KEY`.
   */
  readonly queryKey?: string;

  /**
   * URL prefix for the `path` strategy. Defaults to `"api/v"` —
   * matches the backend's default `API_VERSION_PATH_PREFIX`. The
   * effective path becomes `/{pathPrefix}{version}/...`.
   */
  readonly pathPrefix?: string;

  /**
   * Media-type format string for the `media-type` strategy. `%s` is
   * substituted with the resolved version. Defaults to
   * `"application/vnd.stackra+json;version=%s"` — matches the
   * backend's default `API_VERSION_MEDIA_TYPE_FORMAT`.
   */
  readonly mediaTypeFormat?: string;

  /**
   * Per-connection overrides. Keys match connection names registered
   * with `HttpModule.forRoot({ connections: { ... } })`. Absent
   * connections inherit the top-level `default` + `strategy`.
   */
  readonly connections?: Readonly<Record<string, IConnectionVersioningOptions>>;

  /**
   * Deprecation-log configuration. When omitted, defaults to
   * `{ enabled: true, threshold: "warn" }`.
   */
  readonly deprecationLog?: IDeprecationLogOptions;

  /**
   * Number of days before a `Sunset` date at which the
   * `VERSIONING_SUNSET_APPROACHING` event fires. `0` disables the
   * warning.
   *
   * @default 30
   */
  readonly sunsetWarningDays?: number;
}
