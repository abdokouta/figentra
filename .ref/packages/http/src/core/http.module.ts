/**
 * @file http.module.ts
 * @module @stackra/http/http.module
 * @description HTTP module.
 *
 *   Wires the manager + axios connector + per-connection middleware /
 *   interceptors / pipelines into the DI container. Three entry
 *   points:
 *
 *   - `forRoot(options)`             — static configuration. Registers
 *     built-in middleware (auth, rate-limit, circuit-breaker, dedup,
 *     progress) and built-in interceptors (error-normalizer, retry,
 *     cache, transform, metrics, logging) on every connection.
 *   - `forRootAsync(options)`        — DI-driven async configuration.
 *   - `forFeature(driver, Class)`    — register a custom connector.
 *   - `forFeatureMiddleware(...)`    — register additional connections
 *     and / or per-connection middleware / interceptors.
 *
 *   Mirrors `RedisModule` / `QueueModule` / `RealtimeModule` exactly.
 */

import {
  Global,
  Inject,
  Injectable,
  Module,
  ModuleRef,
  type DynamicModule,
  type OnApplicationBootstrap,
  type Type,
} from "@stackra/container";
import { ConfigModule } from "@stackra/config";
import {
  ConfigScope,
  DEFAULT_HTTP_CONNECTION_TOKEN,
  HTTP_CLIENT,
  HTTP_CONFIG,
  HTTP_MANAGER,
  getHttpConnectionToken,
  type IHttpClient,
  type IHttpConnector,
  type IHttpInterceptor,
  type IHttpManager,
  type IHttpMiddleware,
  type IHttpModuleAsyncOptions,
  type IHttpModuleFeatureOptions,
  type IHttpModuleOptions,
} from "@stackra/contracts";
import { Logger } from "@stackra/logger";

// Framework baseline factory — imported from the publishable
// template at the package root. `HttpModule.forRoot()` self-
// registers this baseline via `ConfigModule.forFeature(...)` per
// ADR-0063 amendment so the app never needs to include it in its
// own `ConfigModule.forRoot({ load })` array.
import { httpConfig } from "../../config/http.config";

import { AxiosConnector } from "./connectors/axios.connector";
import { FetchConnector } from "./connectors/fetch.connector";
import {
  getHttpInterceptorMetadata,
  getHttpMiddlewareMetadata,
} from "./decorators";
import { HttpModuleOptionsError } from "./errors";
import {
  CacheInterceptor,
  ErrorNormalizerInterceptor,
  LocaleFilterResponseInterceptor,
  LoggingInterceptor,
  MetricsInterceptor,
  RetryInterceptor,
  TransformInterceptor,
} from "./interceptors";
import {
  AuthMiddleware,
  CircuitBreakerMiddleware,
  DeduplicationMiddleware,
  LocaleHeaderMiddleware,
  ProgressMiddleware,
  RateLimitMiddleware,
} from "./middleware";
import {
  CircuitBreakerService,
  HttpManager,
  MetricsCollectorService,
  TokenBucketService,
  UploadService,
} from "./services";
import { createLazyHttpClient } from "./utils/create-lazy-http-client.util";

/**
 * Built-in connector registration entry.
 */
export interface IBuiltInConnector {
  /** Driver name. */
  driver: string;
  /** Connector class instantiated via DI. */
  type: Type<IHttpConnector>;
}

/**
 * Built-in connectors registered automatically by `forRoot()`.
 *
 * ## Driver ordering + selection
 *
 * The default driver name is `"fetch"` (since 1.1.0). `fetch` is
 * browser-native + zero-dep — every consumer app gets a working
 * HTTP layer out of the box without installing an extra peer. On
 * Node ≥ 18 + workers + edge runtimes fetch works identically.
 *
 * `AxiosConnector` stays registered for backward compatibility.
 * Consumers who explicitly want axios (e.g. for its interceptor
 * ecosystem, its cancellation model, or Node-side streaming) set
 * `driver: "axios"` on the connection config AND install `axios`
 * as a peer dep — the connector lazy-imports the module at first
 * use and throws a friendly `[AxiosConnector] 'axios' is not
 * installed` error otherwise.
 *
 * Prior to 1.1.0 axios was the DEFAULT which forced every browser
 * consumer to either install a 100kB dep OR register FetchConnector
 * under the driver name `"axios"` as a hack — a workspace-wide
 * pain-point captured in
 * `.kiro/reports/2026-08-13-close-out-sweep.md` amendment 5.
 */
const BUILT_IN_CONNECTORS: readonly IBuiltInConnector[] = Object.freeze([
  { driver: "fetch", type: FetchConnector },
  { driver: "axios", type: AxiosConnector },
]);

/**
 * Built-in middleware classes registered against every connection.
 *
 * The order doesn't matter — each class carries its priority via
 * the `@HttpMiddleware()` decorator.
 */
const BUILT_IN_MIDDLEWARE: readonly Type<IHttpMiddleware>[] = Object.freeze([
  AuthMiddleware,
  RateLimitMiddleware,
  CircuitBreakerMiddleware,
  DeduplicationMiddleware,
  ProgressMiddleware,
]);

/**
 * Built-in interceptor classes registered against every connection.
 */
const BUILT_IN_INTERCEPTORS: readonly Type<IHttpInterceptor>[] = Object.freeze([
  ErrorNormalizerInterceptor,
  RetryInterceptor,
  CacheInterceptor,
  TransformInterceptor,
  MetricsInterceptor,
  LoggingInterceptor,
]);

/**
 * HTTP DI module.
 */
@Global()
@Module({})
export class HttpModule {
  /** Scoped logger. */
  private static readonly logger = new Logger(HttpModule.name);

  // ────────────────────────────────────────────────────────────────────
  // forRoot
  // ────────────────────────────────────────────────────────────────────

  /**
   * Configure the HTTP module statically.
   *
   * @param config - Module options.
   * @returns A dynamic module wiring every provider.
   *
   * @example
   * ```typescript
   * @Module({
   *   imports: [
   *     HttpModule.forRoot({
   *       default: 'api',
   *       connections: {
   *         api:    { baseURL: 'https://api.example.com', timeout: 10_000 },
   *         auth:   { baseURL: 'https://auth.example.com', timeout: 5_000 },
   *       },
   *     }),
   *   ],
   * })
   * export class AppModule {}
   * ```
   */
  public static forRoot(config: IHttpModuleOptions): DynamicModule {
    HttpModule.validate(config);

    const connectionNames = Object.keys(config.connections);
    const connectionTokens = connectionNames.map(getHttpConnectionToken);

    // Connections that opted into the locale filter via
    // `filterLocale: true` — auto-register `LocaleHeaderMiddleware`
    // (request-side header stamp) + `LocaleFilterResponseInterceptor`
    // (response-side slice) on the same subset so opting in is one
    // flag, not two class references. See ADR-0063 §"opt-in via
    // config, not via manual registration" + the file docblock on
    // `locale-filter.interceptor.ts`.
    const localeFilterConnections = Object.entries(config.connections)
      .filter(([, connection]) => connection.filterLocale === true)
      .map(([name]) => name);
    // Per-connection providers return a lazy Proxy over the eventual
    // `IHttpClient`. `manager.connection(name)` is deferred to the
    // first real method call (e.g. `authClient.post('/login', ...)`)
    // so the container can wire consumers in phase 1 without
    // waiting for the built-in axios connector's driver registrar
    // to run in phase 3 (per ADR-0052 + §2.20 of
    // `.kiro/backlog-frontend-2026-07-27.md`).
    const connectionProviders = connectionNames.map((connectionName) => ({
      provide: getHttpConnectionToken(connectionName),
      useFactory: (manager: HttpManager): IHttpClient =>
        createLazyHttpClient(() => manager.connection(connectionName)),
      inject: [HttpManager],
    }));

    return {
      module: HttpModule,
      global: true,
      imports: [
        // Framework baseline — self-registered per ADR-0063 amendment.
        // The static `config` argument acts as an override (Merge
        // scope) that wins over the baseline per field but preserves
        // baseline defaults for anything the caller didn't declare.
        ConfigModule.forFeature(httpConfig, { scope: ConfigScope.Baseline }),
        // Built-in connectors — routed through the canonical
        // `forFeature` seam so the same mechanism serves built-in
        // and consumer-contributed connectors.
        ...BUILT_IN_CONNECTORS.map(({ driver, type }) =>
          HttpModule.forFeature({ driver, connector: type }),
        ),
        // Built-in middleware + interceptors — registered against
        // every configured connection. Preserves the pre-
        // consolidation semantics (previously in
        // `buildMiddlewareRegistrations` /
        // `buildInterceptorRegistrations`).
        HttpModule.forFeature({
          middleware: BUILT_IN_MIDDLEWARE.map((use) => ({
            use,
            connection: connectionNames,
          })),
          interceptors: BUILT_IN_INTERCEPTORS.map((use) => ({
            use,
            connection: connectionNames,
          })),
        }),
        // Opt-in locale substrate — one `forFeature` call for the
        // header middleware + the response interceptor, targeting
        // only the connections that flipped `filterLocale: true`.
        // Empty array is a no-op (the registrar iterates entries).
        ...(localeFilterConnections.length > 0
          ? [
              HttpModule.forFeature({
                middleware: [
                  {
                    use: LocaleHeaderMiddleware,
                    connection: localeFilterConnections,
                  },
                ],
                interceptors: [
                  {
                    use: LocaleFilterResponseInterceptor,
                    connection: localeFilterConnections,
                  },
                ],
              }),
            ]
          : []),
      ],
      providers: [
        // Config — static path binds options directly under
        // HTTP_CONFIG. Collides with ConfigModule.forFeature's own
        // provider under the same token; last-registered wins in
        // the container Map. Since the static path is legacy and
        // callers who pass options intend to override wholesale,
        // this useValue provider is the correct final resolution.
        { provide: HTTP_CONFIG, useValue: config },

        // Manager
        HttpManager,
        { provide: HTTP_MANAGER, useExisting: HttpManager },

        // Support services
        TokenBucketService,
        CircuitBreakerService,
        MetricsCollectorService,
        UploadService,

        // Per-connection providers
        ...connectionProviders,
        // Default-connection alias — same lazy-Proxy treatment as
        // the per-connection providers above. Deferring
        // `manager.connection()` to first use lets the axios
        // registrar run in phase 3 before the underlying resolve
        // fires (see §2.20 note above).
        {
          provide: DEFAULT_HTTP_CONNECTION_TOKEN,
          useFactory: (manager: HttpManager): IHttpClient =>
            createLazyHttpClient(() => manager.connection()),
          inject: [HttpManager],
        },
        {
          provide: HTTP_CLIENT,
          useFactory: (manager: HttpManager): IHttpClient =>
            createLazyHttpClient(() => manager.connection()),
          inject: [HttpManager],
        },
      ],
      exports: [
        HTTP_CONFIG,
        HttpManager,
        HTTP_MANAGER,
        HTTP_CLIENT,
        DEFAULT_HTTP_CONNECTION_TOKEN,
        TokenBucketService,
        CircuitBreakerService,
        MetricsCollectorService,
        UploadService,
        ...connectionTokens,
      ],
    };
  }

  // ────────────────────────────────────────────────────────────────────
  // forRootAsync
  // ────────────────────────────────────────────────────────────────────

  /**
   * Configure the HTTP module asynchronously.
   *
   * Built-in connectors / middleware / interceptors are still
   * registered automatically — only the config object is async.
   * Per-connection tokens are NOT pre-bound (the connection list is
   * unknown at module-build time); use `manager.connection(name)`.
   *
   * @param options - Async options.
   */
  public static forRootAsync(options: IHttpModuleAsyncOptions): DynamicModule {
    if (!options.useFactory) {
      HttpModule.logger.warn("[HttpModule] forRootAsync requires useFactory.");
      return { module: HttpModule, providers: [], exports: [] };
    }

    const injectTokens = (options.inject ?? []) as never[];
    // Self-inject guard — see `SyncModule.forRootAsync` for the full
    // rationale. Short version: when the caller passes
    // `httpConfig.asProvider()`, its `.inject` array contains
    // `httpConfig.KEY === HTTP_CONFIG === "http"`. Re-declaring
    // `{ provide: HTTP_CONFIG, useFactory: (arg) => arg,
    //   inject: [HTTP_CONFIG] }`
    // is a self-referential provider — "Circular dependency
    // detected: http → http". The `ConfigModule.forFeature(
    // httpConfig, Baseline)` line below already binds `HTTP_CONFIG`
    // via `buildMergedPublicProvider` (empty inject); skip the
    // redundant factory-provider in the self-inject case.
    const isSelfInject = injectTokens.some((token) => token === HTTP_CONFIG);

    return {
      module: HttpModule,
      global: true,
      imports: [
        // Framework baseline — self-registered per ADR-0063 amendment.
        // App-side factories (loaded via ConfigModule.forRoot({ load }))
        // deep-merge on top; framework's defaults fill gaps.
        ConfigModule.forFeature(httpConfig, { scope: ConfigScope.Baseline }),
        ...((options.imports ?? []) as never[]),
        // Built-in connectors — routed through the canonical
        // `forFeature` seam. Middleware/interceptors are NOT
        // auto-seeded on connections here because the connection
        // list isn't known synchronously; they still register as
        // bare providers below so feature modules can pull them.
        ...BUILT_IN_CONNECTORS.map(({ driver, type }) =>
          HttpModule.forFeature({ driver, connector: type }),
        ),
      ],
      providers: [
        ...(isSelfInject
          ? []
          : [
              {
                provide: HTTP_CONFIG,
                useFactory: options.useFactory,
                inject: injectTokens,
              },
            ]),

        HttpManager,
        { provide: HTTP_MANAGER, useExisting: HttpManager },

        TokenBucketService,
        CircuitBreakerService,
        MetricsCollectorService,
        UploadService,

        // Default-connection alias — mirrors the `forRoot` shape so
        // `@InjectHttp()` (no arg) works identically on both paths.
        // The connection list is unknown at module-build time on the
        // async path, so per-connection tokens still need
        // `HttpModule.forFeature({ connections })` to register — but
        // the DEFAULT token is fixed and cheap to bind here. Uses the
        // same lazy-Proxy shape as `forRoot`: `manager.connection()`
        // (no arg → the manager's configured default) is deferred to
        // first real HTTP call so the axios registrar's phase-3
        // `manager.extend('axios', ...)` runs first (§2.20 of
        // `.kiro/backlog-frontend-2026-07-27.md`).
        //
        // Not binding this on the async path was the root cause of
        // the dashboard boot failure — `SessionService` uses
        // `@InjectHttp()` (no arg) → `HTTP_CLIENT`, and every
        // `@stackra/*` app config wires HTTP through
        // `HttpModule.forRootAsync(httpConfig.asProvider())` for
        // env-driven `baseURL`.
        {
          provide: HTTP_CLIENT,
          useFactory: (manager: HttpManager): IHttpClient =>
            createLazyHttpClient(() => manager.connection()),
          inject: [HttpManager],
        },

        // Built-in middleware/interceptors are still registered as
        // providers so feature modules can pull them through DI when
        // needed.
        ...BUILT_IN_MIDDLEWARE,
        ...BUILT_IN_INTERCEPTORS,
      ],
      exports: [
        HTTP_CONFIG,
        HttpManager,
        HTTP_MANAGER,
        HTTP_CLIENT,
        DEFAULT_HTTP_CONNECTION_TOKEN,
        TokenBucketService,
        CircuitBreakerService,
        MetricsCollectorService,
        UploadService,
      ],
    };
  }

  // ────────────────────────────────────────────────────────────────────
  // forFeature — additional driver
  // ────────────────────────────────────────────────────────────────────

  /**
   * Register feature-scoped HTTP wiring: a custom driver and/or extra
   * connections and/or per-connection middleware / interceptors.
   *
   * Post-wire registration runs through a real `@Injectable()` seeder
   * (`HttpFeatureRegistrar`) that implements `OnApplicationBootstrap`
   * and resolves middleware/interceptor instances via `ModuleRef` — no
   * synthetic bootstrap token, no constructor side effects.
   *
   * @param options - Feature options (all fields optional).
   * @returns A dynamic module wiring the requested providers.
   *
   * @example
   * ```typescript
   * import { FetchConnector } from '@stackra/http/fetch';
   *
   * @Module({
   *   imports: [
   *     // Register a custom driver:
   *     HttpModule.forFeature({ driver: 'fetch', connector: FetchConnector }),
   *
   *     // Add a connection + scoped middleware/interceptors:
   *     HttpModule.forFeature({
   *       connections: {
   *         billing: { baseURL: 'https://billing.example.com', timeout: 15_000 },
   *       },
   *       middleware: [{ use: AuditMiddleware, connection: 'billing' }],
   *       interceptors: [{ use: TraceInterceptor, connection: ['api', 'billing'] }],
   *     }),
   *   ],
   * })
   * export class BillingModule {}
   * ```
   */
  public static forFeature(options: IHttpModuleFeatureOptions): DynamicModule {
    const connectionEntries = Object.entries(options.connections ?? {});
    const middlewareEntries = options.middleware ?? [];
    const interceptorEntries = options.interceptors ?? [];
    const { driver, connector } = options;

    const connectionTokens = connectionEntries.map(([name]) =>
      getHttpConnectionToken(name),
    );
    // Per-feature connection providers register the connection
    // config eagerly (so `HttpModule.forRoot(...)` middleware/
    // interceptor sweeps see the new connection at bootstrap) but
    // defer `manager.connection(name)` to first real use via a
    // lazy Proxy. The eager form of this factory triggered the
    // axios driver race described in
    // `.kiro/backlog-frontend-2026-07-27.md` §2.20 — the connection
    // resolve fired before `HttpFeatureRegistrar` had a chance to
    // `manager.extend('axios', ...)` in `OnApplicationBootstrap`.
    const connectionProviders = connectionEntries.map(([name, config]) => ({
      provide: getHttpConnectionToken(name),
      useFactory: (manager: HttpManager): IHttpClient => {
        manager.addConnection(name, config);
        return createLazyHttpClient(() => manager.connection(name));
      },
      inject: [HttpManager],
    }));

    const uniqueMiddlewareClasses = Array.from(
      new Set(middlewareEntries.map((e) => e.use)),
    );
    const uniqueInterceptorClasses = Array.from(
      new Set(interceptorEntries.map((e) => e.use)),
    );

    /**
     * Per-feature seeder. A standard `@Injectable()` provider whose
     * `onApplicationBootstrap()` performs post-wire registration once
     * every module has initialised. Middleware/interceptor instances
     * are resolved from the container via `ModuleRef` (inversion of
     * control) rather than being force-instantiated by a marker token.
     */
    @Injectable()
    class HttpFeatureRegistrar implements OnApplicationBootstrap {
      public constructor(
        @Inject(HTTP_MANAGER) private readonly manager: IHttpManager,
        private readonly moduleRef: ModuleRef,
      ) {}

      public async onApplicationBootstrap(): Promise<void> {
        // 1. Register a custom driver, if requested.
        if (driver && connector) {
          const instance = this.moduleRef.get<IHttpConnector>(connector);
          if (instance) {
            this.manager.extend(driver, (config) =>
              this.manager.createClientFromConnector(instance, config),
            );
          }
        }

        // 2. Add feature connections so middleware can target them.
        for (const [name, config] of connectionEntries) {
          this.manager.addConnection(name, config);
        }

        // 3. Register middleware on their target connections.
        for (const entry of middlewareEntries) {
          const instance = this.moduleRef.get<IHttpMiddleware>(entry.use);
          if (!instance) continue;
          const meta = getHttpMiddlewareMetadata(entry.use);
          const priority = entry.priority ?? meta?.priority ?? 50;
          const name = entry.name ?? meta?.name ?? entry.use.name;
          for (const target of HttpModule.resolveTargets(
            entry.connection,
            this.manager,
          )) {
            const registry = await this.manager.getMiddlewareRegistry(target);
            registry.registerWithPriority(name, instance, priority);
          }
        }

        // 4. Register interceptors on their target connections.
        for (const entry of interceptorEntries) {
          const instance = this.moduleRef.get<IHttpInterceptor>(entry.use);
          if (!instance) continue;
          const meta = getHttpInterceptorMetadata(entry.use);
          const priority = entry.priority ?? meta?.priority ?? 50;
          const name = entry.name ?? meta?.name ?? entry.use.name;
          for (const target of HttpModule.resolveTargets(
            entry.connection,
            this.manager,
          )) {
            const registry = await this.manager.getInterceptorRegistry(target);
            registry.registerWithPriority(name, instance, priority);
          }
        }
      }
    }

    const providers: unknown[] = [
      ...uniqueMiddlewareClasses,
      ...uniqueInterceptorClasses,
      ...connectionProviders,
      HttpFeatureRegistrar,
    ];
    if (connector) providers.unshift(connector);

    return {
      module: HttpModule,
      providers: providers as never[],
      exports: connectionTokens,
    };
  }

  // ────────────────────────────────────────────────────────────────────
  // forFeatureAsync — DI-driven feature registration
  // ────────────────────────────────────────────────────────────────────

  /**
   * Register feature-scoped HTTP wiring where the config isn't known
   * at module-build time.
   *
   * Canonical use case: an upstream module (auth, notifications-push,
   * storage-native) wants to register a named connection whose
   * `baseURL` / `timeout` / `headers` come from a `@stackra/config`
   * factory — those values only resolve at DI-resolution time, well
   * after the module tree finishes assembling.
   *
   * Mirrors NestJS's `<X>Module.forRootAsync` shape:
   *
   * ```typescript
   * HttpModule.forFeatureAsync({
   *   imports: [ConfigModule.forFeature(authConfig)],
   *   useFactory: (config: IAuthModuleOptions) => ({
   *     connections: {
   *       auth: {
   *         baseURL: config.api.baseURL,
   *         headers: { ...config.api.headers },
   *         timeout: config.api.timeout,
   *       },
   *     },
   *   }),
   *   inject: [authConfig.KEY],
   * })
   * ```
   *
   * ## What's supported on the async path
   *
   * - `connections` — registered via `manager.addConnection(name, cfg)`
   *   at `OnApplicationBootstrap`. Consumers reach them through
   *   `manager.connection(name)` at runtime (the per-connection
   *   `getHttpConnectionToken(name)` provider is NOT bound — the
   *   connection list isn't known at module-build time, so the DI
   *   token can't be pre-declared).
   * - `driver` + `connector` — custom driver registration, same as
   *   the sync `forFeature`.
   *
   * ## What's NOT supported
   *
   * - `middleware` + `interceptors` — those require class references
   *   at module-build time (so the container can instantiate them
   *   before the registrar's bootstrap hook resolves them via
   *   `ModuleRef`). If a package needs runtime middleware, register
   *   them through the sync `forFeature({ middleware: [...] })` and
   *   let the async form handle connection config only.
   *
   * @param options - Async options mirroring `IHttpModuleAsyncOptions`.
   * @returns A dynamic module that resolves feature options at
   *   bootstrap and applies them via `manager.addConnection` +
   *   `manager.extend`.
   */
  public static forFeatureAsync(options: {
    /** Modules to import before the factory resolves. */
    readonly imports?: readonly DynamicModule[];
    /** Factory producing the resolved feature options. */
    readonly useFactory: (
      ...args: readonly unknown[]
    ) => IHttpModuleFeatureOptions | Promise<IHttpModuleFeatureOptions>;
    /** Providers injected as positional arguments into `useFactory`. */
    readonly inject?: readonly (string | symbol)[];
  }): DynamicModule {
    // Package-scoped token — unique per invocation so multiple
    // `forFeatureAsync` calls in the same tree don't collide on
    // the intermediate options provider. The token is opaque to
    // consumers.
    const FEATURE_OPTIONS_TOKEN = Symbol("HTTP_FEATURE_OPTIONS_ASYNC");

    /**
     * Bootstrap-time registrar. Resolves the feature options via
     * DI, then applies them to the manager exactly like the sync
     * `forFeature`'s registrar does — but through data resolved at
     * runtime rather than closed over at module-build time.
     */
    @Injectable()
    class HttpFeatureAsyncRegistrar implements OnApplicationBootstrap {
      public constructor(
        @Inject(FEATURE_OPTIONS_TOKEN)
        private readonly featureOptions: IHttpModuleFeatureOptions,
        @Inject(HTTP_MANAGER) private readonly manager: IHttpManager,
        private readonly moduleRef: ModuleRef,
      ) {}

      public onApplicationBootstrap(): void {
        const { driver, connector, connections } = this.featureOptions;

        // 1. Custom driver — same semantics as sync forFeature.
        if (driver && connector) {
          const instance = this.moduleRef.get<IHttpConnector>(
            connector as Type<IHttpConnector>,
          );
          if (instance) {
            this.manager.extend(driver, (config) =>
              this.manager.createClientFromConnector(instance, config),
            );
          }
        }

        // 2. Connections — register each on the manager. Per-name
        // DI tokens are NOT bound on the async path (see JSDoc);
        // consumers reach connections through
        // `manager.connection(name)` at runtime.
        if (connections) {
          for (const [name, config] of Object.entries(connections)) {
            this.manager.addConnection(name, config);
          }
        }
      }
    }

    const providers: unknown[] = [
      {
        provide: FEATURE_OPTIONS_TOKEN,
        useFactory: options.useFactory,
        inject: (options.inject ?? []) as never[],
      },
      HttpFeatureAsyncRegistrar,
    ];
    if (options.useFactory && typeof options.useFactory === "function") {
      // No-op guard — TypeScript flow analysis needs the `useFactory`
      // reference read for the `readonly` shape to narrow.
    }

    return {
      module: HttpModule,
      imports: (options.imports ?? []) as never[],
      providers: providers as never[],
      exports: [],
    };
  }

  // ────────────────────────────────────────────────────────────────────
  // Internal — helpers
  // ────────────────────────────────────────────────────────────────────

  /** Resolve the connection list for a feature middleware/interceptor entry. */
  private static resolveTargets(
    connection: string | string[] | undefined,
    manager: IHttpManager,
  ): string[] {
    if (connection === undefined) return [manager.getDefaultConnectionName()];
    if (Array.isArray(connection)) return connection;
    return [connection];
  }

  // ────────────────────────────────────────────────────────────────────
  // Internal — config validation
  // ────────────────────────────────────────────────────────────────────

  /**
   * Surface configuration mistakes at bootstrap.
   */
  private static validate(config: IHttpModuleOptions): void {
    if (!config) {
      throw new HttpModuleOptionsError(
        "[HttpModule] forRoot() requires a configuration object.",
      );
    }

    if (!config.default) {
      throw new HttpModuleOptionsError(
        "[HttpModule] config.default is required.",
      );
    }

    if (!config.connections || Object.keys(config.connections).length === 0) {
      throw new HttpModuleOptionsError(
        "[HttpModule] config.connections must define at least one entry.",
      );
    }

    if (!config.connections[config.default]) {
      throw new HttpModuleOptionsError(
        `[HttpModule] config.default "${config.default}" is not present in config.connections.`,
      );
    }
  }
}
