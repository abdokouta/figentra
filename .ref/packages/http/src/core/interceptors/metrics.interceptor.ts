/**
 * @file metrics.interceptor.ts
 * @module @stackra/http/interceptors/metrics
 * @description Metrics interceptor.
 *
 *   Records request latency, status, and success/failure counts via
 *   `MetricsCollectorService`. Optional Sentry integration adds
 *   breadcrumbs and capture-exception calls when a Sentry global is
 *   present in the runtime — no hard import on `@sentry/*`.
 */

import { Inject } from "@stackra/container";
import {
  HTTP_CONFIG,
  type IHttpContext,
  type IHttpInterceptor,
  type IHttpModuleOptions,
  type IHttpNextFunction,
  type IHttpRequestConfig,
  type IHttpResponse,
  type ISentryClient,
} from "@stackra/contracts";

import { HttpInterceptor } from "../decorators/http-interceptor.decorator";
import { MetricsCollectorService } from "../services/metrics-collector.service";

/**
 * Metrics interceptor.
 */
@HttpInterceptor({ priority: 90, name: "metrics" })
export class MetricsInterceptor implements IHttpInterceptor {
  /**
   * @param config           - Module options.
   * @param metricsCollector - In-memory aggregator.
   */
  public constructor(
    @Inject(HTTP_CONFIG) private readonly config: IHttpModuleOptions,
    private readonly metricsCollector: MetricsCollectorService,
  ) {}

  /** @inheritdoc */
  public async intercept(
    context: IHttpContext,
    next: IHttpNextFunction,
  ): Promise<IHttpResponse> {
    const metricsConfig = this.config.connections[this.config.default]?.metrics;
    if (!metricsConfig?.enabled) return next(context);

    const sampleRate = metricsConfig.sampleRate ?? 1.0;
    if (sampleRate < 1.0 && Math.random() > sampleRate) {
      return next(context);
    }

    const startedAt = Date.now();
    const endpoint = MetricsInterceptor.endpointKey(context.request);

    if (metricsConfig.sentry?.enabled) {
      this.addSentryBreadcrumb({
        category: "http",
        message: `${context.request.method ?? "GET"} ${context.request.url ?? ""}`,
        level: "info",
        data: {
          method: context.request.method,
          url: context.request.url,
        },
      });
    }

    try {
      const response = await next(context);
      const duration = Date.now() - startedAt;

      this.metricsCollector.recordRequest({
        endpoint,
        method: context.request.method ?? "GET",
        status: response.status,
        duration,
        success: response.status >= 200 && response.status < 300,
      });

      if (metricsConfig.sentry?.enabled) {
        this.recordSentryTransaction({
          name: endpoint,
          op: "http.client",
          status: "ok",
        });
      }

      return response;
    } catch (err: unknown) {
      const duration = Date.now() - startedAt;
      const status = (err as { statusCode?: number }).statusCode ?? 0;

      this.metricsCollector.recordRequest({
        endpoint,
        method: context.request.method ?? "GET",
        status,
        duration,
        success: false,
      });

      if (metricsConfig.sentry?.enabled) {
        this.captureSentryException(err, {
          tags: {
            endpoint,
            method: context.request.method,
            status,
          },
          extra: { duration, url: context.request.url },
        });
        this.recordSentryTransaction({
          name: endpoint,
          op: "http.client",
          status: "error",
        });
      }

      throw err;
    }
  }

  /** `"{METHOD}:{URL}"` lookup key. */
  private static endpointKey(request: IHttpRequestConfig): string {
    return `${request.method ?? "GET"}:${request.url ?? ""}`;
  }

  /**
   * Resolve a Sentry global from the runtime, when present.
   *
   * Tolerates either a `globalThis.Sentry` global (browser SDK) or a
   * `__SENTRY__` namespace (some integrations). Returned type is
   * `ISentryClient | null` — the interface's methods are declared
   * required, but every call site here defensively adds `?.` on the
   * method invocation to guard against a partial or non-Sentry
   * global under the same namespace.
   */
  private static getSentry(): ISentryClient | null {
    const g = globalThis as {
      Sentry?: ISentryClient;
      __SENTRY__?: ISentryClient;
    };
    return g.Sentry ?? g.__SENTRY__ ?? null;
  }

  /** Add a Sentry breadcrumb when the SDK is available. */
  private addSentryBreadcrumb(breadcrumb: Record<string, unknown>): void {
    const sentry = MetricsInterceptor.getSentry();
    sentry?.addBreadcrumb?.(breadcrumb);
  }

  /** Capture a Sentry exception when the SDK is available. */
  private captureSentryException(
    err: unknown,
    ctx: Record<string, unknown>,
  ): void {
    const sentry = MetricsInterceptor.getSentry();
    sentry?.captureException?.(err, ctx);
  }

  /** Record a Sentry transaction when the SDK is available. */
  private recordSentryTransaction(descriptor: {
    name: string;
    op: string;
    status: string;
  }): void {
    const sentry = MetricsInterceptor.getSentry();
    if (!sentry?.startTransaction) return;
    const tx = sentry.startTransaction({
      name: descriptor.name,
      op: descriptor.op,
    });
    tx?.setStatus?.(descriptor.status);
    tx?.finish?.();
  }
}
