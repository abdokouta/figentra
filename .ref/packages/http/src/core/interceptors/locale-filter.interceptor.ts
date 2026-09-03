/**
 * @file locale-filter.interceptor.ts
 * @module @stackra/http/interceptors/locale-filter
 * @description Response interceptor that resolves inline-per-locale
 *   payloads at the transport boundary.
 *
 *   The interceptor walks the parsed response body. Every object
 *   whose keys are EXACTLY a subset of the supported locale codes
 *   (e.g. `{ en: "…", ar: "…", ru: "…" }`) is a "locale map" — the
 *   interceptor replaces it with the value at the active locale
 *   (falling back to `en`, then to the first non-null value, then
 *   `null`). Every other object recurses into its children;
 *   arrays recurse element-wise; primitives pass through unchanged.
 *
 *   Consumers opt in per-connection via
 *   `IHttpClientConfig.filterLocale: true` — `HttpModule.forRoot`
 *   auto-registers this interceptor alongside `LocaleHeaderMiddleware`
 *   on every connection that flips the flag.
 *
 *   Priority 90 — runs AFTER `TransformInterceptor` (70) so
 *   snake_case→camelCase + date-parsing complete before the locale
 *   slice walks the tree.
 *
 *   Fail-soft: when `I18N_LOCALE_SERVICE` is not bound (i18n
 *   package not installed), or when the service returns an empty
 *   supported-locale list, the interceptor becomes a pass-through.
 *
 *   Per-request opt-out: set `meta.skipLocaleFilter: true`
 *   (or the legacy `meta.skipLocale: true`) on the request.
 *
 * @example Enable per connection
 * ```typescript
 * HttpModule.forRoot({
 *   default: "api",
 *   connections: {
 *     api: {
 *       baseURL: "/",
 *       filterLocale: true, // ← auto-registers this interceptor
 *     },
 *   },
 * });
 * ```
 *
 * @example Opt out per request
 * ```typescript
 * http.get("/api/v1/pages/raw.json", {
 *   meta: { skipLocaleFilter: true }, // returns the raw locale-map tree
 * });
 * ```
 */

import { Inject, Optional } from "@stackra/container";

import {
  I18N_LOCALE_SERVICE,
  type IHttpContext,
  type IHttpInterceptor,
  type IHttpNextFunction,
  type IHttpResponse,
  type II18nLocaleService,
} from "@stackra/contracts";

import { HttpInterceptor } from "../decorators/http-interceptor.decorator";

/**
 * Response interceptor that resolves inline-per-locale payloads.
 *
 * See the file docblock for the full contract.
 */
@HttpInterceptor({ priority: 90, name: "locale-filter" })
export class LocaleFilterResponseInterceptor implements IHttpInterceptor {
  /**
   * @param localeService - Optional locale orchestrator. When
   *   unbound (i18n package not installed) the interceptor becomes
   *   a pass-through.
   */
  public constructor(
    @Optional()
    @Inject(I18N_LOCALE_SERVICE)
    private readonly localeService?: II18nLocaleService,
  ) {}

  /** @inheritdoc */
  public async intercept(
    context: IHttpContext,
    next: IHttpNextFunction,
  ): Promise<IHttpResponse> {
    const response = await next(context);

    // Fail-soft — no locale service = no slice.
    if (!this.localeService) return response;

    // Per-request opt-out. `skipLocaleFilter` is the canonical
    // name; `skipLocale` is honoured for symmetry with
    // `LocaleHeaderMiddleware`.
    const meta = context.request.meta;
    if (meta?.["skipLocaleFilter"] === true) return response;
    if (meta?.["skipLocale"] === true) return response;

    const locale = this.localeService.getLocale();
    const supported = this.localeService.getSupportedLocales();

    // Guard against a misconfigured locale service — an empty
    // supported set would misclassify every object as a locale
    // map (vacuous `every`). Pass through in that case.
    if (!locale || !supported || supported.length === 0) return response;

    const supportedSet = new Set<string>(supported);
    const sliced = sliceLocaleTree(response.data, locale, supportedSet);

    // Preserve the response shape — mutate `data` on a shallow
    // clone. IHttpResponse is a plain object; a spread copy
    // survives the type contract.
    return { ...response, data: sliced } as IHttpResponse;
  }
}

/**
 * Recursively walk a value tree and collapse every locale-map
 * object to its active-locale value.
 *
 * A "locale map" is a non-empty object whose keys are entirely a
 * subset of the supported-locale set. `{ en, ar, ru }` matches.
 * `{ en, ar }` (missing ru but the two present keys are supported)
 * ALSO matches — the shape is defined by the KEYS BEING SUPPORTED
 * codes, not by every supported code being present. `{ image,
 * type }` does not match — those aren't locale codes.
 *
 * Fallback chain when the active locale's value is null: `en` →
 * first non-null value in the map → `null`.
 *
 * @param node - The current tree node to walk.
 * @param locale - The active locale code.
 * @param supported - Set of every supported locale code.
 * @returns A new tree with every locale-map replaced by its
 *   active-locale value.
 */
export function sliceLocaleTree(
  node: unknown,
  locale: string,
  supported: ReadonlySet<string>,
): unknown {
  // Primitives + null pass through untouched.
  if (node === null || typeof node !== "object") return node;

  // Arrays recurse element-wise.
  if (Array.isArray(node)) {
    return node.map((child) => sliceLocaleTree(child, locale, supported));
  }

  const record = node as Record<string, unknown>;
  const keys = Object.keys(record);

  // Empty object — not a locale map. Recurse (no-op) + preserve.
  if (keys.length === 0) return record;

  // "Every key is a supported locale code" — the locale-map
  // heuristic.
  const isLocaleMap = keys.every((k) => supported.has(k));

  if (isLocaleMap) {
    const active = record[locale];
    if (active !== null && active !== undefined) return active;

    // Fallback 1 — English.
    const enValue = record["en"];
    if (enValue !== null && enValue !== undefined) return enValue;

    // Fallback 2 — first non-null value in the map.
    for (const key of keys) {
      const value = record[key];
      if (value !== null && value !== undefined) return value;
    }

    // Fallback 3 — every value was null.
    return null;
  }

  // Structural object — recurse into every child.
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    out[key] = sliceLocaleTree(record[key], locale, supported);
  }
  return out;
}
