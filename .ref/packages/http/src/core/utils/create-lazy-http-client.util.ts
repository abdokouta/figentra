/**
 * @file create-lazy-http-client.util.ts
 * @module @stackra/http/core/utils
 * @description Wraps a lazy `Promise<IHttpClient>` resolver in a
 *   `Proxy` so `manager.connection(name)` fires on FIRST METHOD CALL
 *   rather than at container-init time.
 *
 *   Motivates fix — the DI container evaluates provider factories in
 *   phase 1 (`OnModuleInit`), but the built-in axios connector +
 *   consumer-contributed connectors register through inline
 *   `@Injectable() HttpFeatureRegistrar implements
 *   OnApplicationBootstrap` classes (phase 3, per ADR-0052). An
 *   eager `useFactory: (manager) => manager.connection(name)`
 *   therefore throws `Instance driver [axios] is not supported`
 *   because the axios driver hasn't been registered yet.
 *
 *   The lazy Proxy shipped here preserves the DI contract —
 *   `@InjectHttp('auth')` still yields an `IHttpClient`-shaped
 *   object at construction — while deferring `manager.connection()`
 *   to the first consumer call (`.get`, `.post`, `.put`, `.patch`,
 *   `.delete`, `.request`, `.stream`, `.sse`). By then every
 *   OnApplicationBootstrap registrar has run, so the axios driver
 *   is present.
 *
 *   Closes `.kiro/backlog-frontend-2026-07-27.md` §2.20 (same shape
 *   as §2.19 Option A).
 */

import type { IHttpClient, IHttpStream } from "@stackra/contracts";

/**
 * Unary `IHttpClient` methods — every one returns
 * `Promise<IHttpResponse<T>>`. Kept as a `Set` for O(1) lookup in
 * the Proxy `get` trap.
 */
const UNARY_METHODS: ReadonlySet<string> = new Set([
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "request",
]);

/**
 * Streaming `IHttpClient` methods — every one SYNCHRONOUSLY returns
 * an `IHttpStream<T>` (an async-iterable + `cancel()`). The lazy
 * Proxy returns a lazy stream that awaits the underlying client
 * inside the first `.next()` iteration.
 */
const STREAM_METHODS: ReadonlySet<string> = new Set(["stream", "sse"]);

/**
 * Build a lazy `IHttpClient` handle that resolves through
 * `resolve()` on first method invocation.
 *
 * The returned object is a `Proxy` over an empty target. Every
 * method call transparently forwards to the resolved concrete
 * `IHttpClient`; the first call triggers `resolve()` and caches the
 * concrete instance for every subsequent call. Because the Proxy
 * never touches `resolve` before that first call, the DI factory
 * that builds the Proxy can safely run in phase 1 even when the
 * eventual connector driver has not been registered yet.
 *
 * Unary methods (`get` / `post` / `put` / `patch` / `delete` /
 * `request`) return `Promise<IHttpResponse<T>>` — the Proxy
 * transparently awaits `resolve()` before calling through.
 *
 * Streaming methods (`stream` / `sse`) synchronously return an
 * `IHttpStream<T>`. The Proxy returns a lazy stream wrapper that
 * awaits `resolve()` and materialises the concrete stream on the
 * first `.next()` iteration or first `.cancel()` call.
 *
 * @param resolve - Callback that returns a `Promise<IHttpClient>`
 *   for the concrete connection. Typically
 *   `() => manager.connection(name)`. Invoked at most once — on
 *   the first proxy method call. Any rejection bubbles through the
 *   caller's `await`.
 * @returns A Proxy that satisfies `IHttpClient` structurally,
 *   forwards every unary + streaming method to the resolved
 *   concrete client, and caches the client internally.
 *
 * @example
 * ```typescript
 * const lazy = createLazyHttpClient(() => manager.connection('auth'));
 * // No connector registered yet — safe:
 * const holder = lazy;
 * // Now the connector has been registered (OnApplicationBootstrap
 * // ran) — first call resolves + caches:
 * const response = await holder.post('/login', { email, password });
 * ```
 */
export function createLazyHttpClient(
  resolve: () => Promise<IHttpClient>,
): IHttpClient {
  // Cached `Promise<IHttpClient>` — the FIRST call captures the
  // pending resolve; every subsequent call awaits the same promise.
  // Using a promise (not the resolved value) means two concurrent
  // first-uses share one underlying `manager.connection()` call
  // rather than racing to register it twice.
  let cached: Promise<IHttpClient> | undefined;

  /**
   * Idempotent resolver. First call captures the resolver's
   * promise; every subsequent call returns the same promise so
   * cache hits + concurrent first-uses both see one shared
   * resolution.
   */
  const getClient = async (): Promise<IHttpClient> => {
    if (cached !== undefined) return cached;
    cached = resolve();
    return cached;
  };

  // Empty concrete target — every method access resolves through
  // the `get` trap below. Casting to `IHttpClient` is safe because
  // every property access is intercepted; the compiler-facing shape
  // is what matters to consumers.
  return new Proxy({} as IHttpClient, {
    /**
     * Intercept every property read on the lazy handle. Only the
     * documented `IHttpClient` methods are meaningful; every other
     * property read returns `undefined` so we don't accidentally
     * expose Proxy machinery.
     */
    get(
      _target: IHttpClient,
      property: string | symbol,
      _receiver: unknown,
    ): unknown {
      // Symbols and non-string keys are never part of the public
      // `IHttpClient` shape (no `Symbol.iterator` etc.) — fall
      // through to `undefined` so `typeof proxy.foo === "function"`
      // gates work correctly.
      if (typeof property !== "string") return undefined;

      if (UNARY_METHODS.has(property)) {
        // Return a function that resolves the concrete client on
        // first invocation, then forwards. Preserves the caller's
        // argument list byte-for-byte.
        return async (...args: unknown[]): Promise<unknown> => {
          const client = await getClient();
          const method = (client as unknown as Record<string, unknown>)[
            property
          ] as (...a: unknown[]) => Promise<unknown>;
          return method.apply(client, args);
        };
      }

      if (STREAM_METHODS.has(property)) {
        // Streaming methods return SYNCHRONOUSLY — we can't await
        // the client before returning. Instead, return a stream
        // proxy that awaits the concrete stream on first
        // `.next()` iteration or first `.cancel()` call.
        return (...args: unknown[]): IHttpStream<unknown> =>
          createLazyHttpStream(async () => {
            const client = await getClient();
            const method = (client as unknown as Record<string, unknown>)[
              property
            ] as (...a: unknown[]) => IHttpStream<unknown>;
            return method.apply(client, args);
          });
      }

      // Anything else is not part of the `IHttpClient` public
      // surface. Return undefined so callers see a clean shape.
      return undefined;
    },
  });
}

/**
 * Build a lazy `IHttpStream<T>` handle that resolves the underlying
 * concrete stream on first iteration.
 *
 * Behaviour matches the concrete `IHttpStream`:
 *
 * - `Symbol.asyncIterator()` returns an iterator whose first
 *   `.next()` awaits `resolve()`, then delegates every subsequent
 *   `.next()` to the concrete stream's iterator.
 * - `cancel()` before the stream has resolved marks it cancelled;
 *   the pending resolve runs to completion and the concrete stream
 *   is cancelled immediately. `cancel()` after resolution
 *   short-circuits to the concrete cancel.
 *
 * @typeParam T - Decoded stream value type.
 * @param resolve - Callback that returns the concrete
 *   `IHttpStream<T>` when the underlying client is ready.
 * @returns A stream that iterates lazily against the resolved
 *   concrete stream.
 */
function createLazyHttpStream<T>(
  resolve: () => Promise<IHttpStream<T>>,
): IHttpStream<T> {
  // The concrete stream, cached after first successful resolve.
  let concrete: IHttpStream<T> | undefined;
  // Cancellation flag — set by `cancel()` regardless of whether the
  // concrete stream has resolved yet. On first `.next()` we check
  // this before beginning iteration; on late `cancel()` we forward
  // to the concrete stream.
  let cancelled = false;

  return {
    [Symbol.asyncIterator](): AsyncIterator<T> {
      // Lazy inner iterator — populated inside the FIRST `.next()`
      // so we don't touch `resolve()` until iteration begins.
      let inner: AsyncIterator<T> | undefined;

      return {
        async next(): Promise<IteratorResult<T>> {
          if (!inner) {
            // First iteration — resolve the concrete stream, then
            // start iterating it. Uses `??=` per workspace eslint
            // rule (@typescript-eslint/prefer-nullish-coalescing);
            // the `await` on the right-hand side runs only when
            // `concrete` is nullish, so no double-resolve happens.
            concrete ??= await resolve();
            if (cancelled) {
              // A cancel came in before the stream materialised.
              // Cancel the concrete stream now and settle the
              // iterator immediately.
              concrete.cancel();
              return { value: undefined, done: true };
            }
            inner = concrete[Symbol.asyncIterator]();
          }
          return inner.next();
        },
      };
    },
    cancel(): void {
      // Set the flag unconditionally so a very-early cancel is
      // remembered when the stream eventually resolves.
      cancelled = true;
      if (concrete !== undefined) concrete.cancel();
    },
  };
}
