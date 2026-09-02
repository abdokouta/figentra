/**
 * @file sentry-client.interface.ts
 * @module @stackra/contracts/interfaces/sentry
 * @description Canonical structural narrowing of the `@sentry/*` SDK
 *   surface every `@stackra/*` package consumes when it needs to
 *   forward errors, messages, breadcrumbs, or transactions to a
 *   Sentry instance — whether that instance is a runtime browser
 *   global (`window.Sentry`) or a lazy-imported `@sentry/browser`
 *   / `@sentry/react-native` module.
 *
 *   The interface exists because four separately-owned `@stackra/*`
 *   packages each shipped an identical (or overlapping) local
 *   `SentryLike` / `ISentryReactNativeModule` shim of the same
 *   shape — a pattern
 *   `.kiro/steering/contract-reexports.md` §"Rule — never define a
 *   local `I*Like` structural shim for a missing contract"
 *   explicitly bans. The multi-consumer test in
 *   `.kiro/steering/contracts-and-decorators-promotion.md` §"Test
 *   A" is met comfortably (4-5 sites across 3 packages), so the
 *   correct fix is to promote the interface into
 *   `@stackra/contracts` and have every consumer
 *   `import type { ISentryClient } from "@stackra/contracts"`.
 *
 *   ## Consumers (as of 2026-07-27)
 *
 *   - `@stackra/http` — `MetricsInterceptor.getSentry()` probes
 *     `globalThis.Sentry` / `globalThis.__SENTRY__` to forward
 *     breadcrumbs + exceptions + transactions from the HTTP
 *     metrics interceptor without a hard `@sentry/*` peer.
 *   - `@stackra/monitoring/core` — `SentryMonitoringProvider`
 *     lazy-imports `@sentry/browser` and narrows the resolved
 *     module to this shape.
 *   - `@stackra/monitoring/native` — `SentryRnMonitoringReporter`
 *     lazy-imports `@sentry/react-native` and narrows to this
 *     shape.
 *   - `@stackra/logger/native` — `SentryBreadcrumbReporter`
 *     lazy-imports `@sentry/react-native` and narrows to this
 *     shape (uses only `addBreadcrumb`).
 *
 *   ## Why structural narrowing (not the full `@sentry/*` types)
 *
 *   The three Sentry SDKs (`@sentry/browser`, `@sentry/react`,
 *   `@sentry/react-native`) each ship ~100 exported symbols across
 *   ~40 methods. Every consumer here uses six methods at most
 *   (`init`, `captureException`, `captureMessage`, `addBreadcrumb`,
 *   `setUser`, `setContext`, `flush`, plus the browser-only
 *   `startTransaction`). The narrower shape:
 *
 *   - Keeps every `@sentry/*` peer OPTIONAL — packages that don't
 *     wire Sentry don't force any Sentry SDK into the consumer's
 *     install graph.
 *   - Works uniformly across web + native + Node — the concrete
 *     Sentry SDKs are all structurally assignable to this
 *     superset.
 *   - Documents the exact surface every consumer relies on — future
 *     drift shows up here in one place instead of four.
 *   - Lets the browser probe path (`globalThis.Sentry`) type
 *     against the same interface as the lazy-imported SDK path.
 *     The probe defensively adds `?.` to method calls at every
 *     site (`sentry?.addBreadcrumb?.(...)`), which remains valid
 *     even when the interface declares methods as required.
 *
 *   ## Third-party narrowing exemption
 *
 *   `contract-reexports.md`'s `I<Name>Like` ban targets structural
 *   shims that mirror an EXISTING RUNTIME TYPE inside the workspace.
 *   Sentry's `Hub` / `Client` / `Scope` interfaces are third-party
 *   types, not workspace contracts — narrowing them via a
 *   purpose-built named interface (with this docblock naming the
 *   consumers + the drift concern the audit raised) is the correct
 *   promotion outcome, not a violation. Same pattern as the sibling
 *   `INativeNavigation` + `IAppState` + `IAppearance` promotions.
 */

/**
 * Sentry-native severity vocabulary — shape-identical to
 * Stackra's own `MonitoringSeverity` and `LogLevel` maps to
 * these labels. Kept as an exported type so consumers can narrow
 * `captureException` / `captureMessage` / `addBreadcrumb` level
 * arguments against the same union Sentry itself accepts.
 */
export type SentryLevel = "fatal" | "error" | "warning" | "info" | "debug";

/**
 * Structural view of the subset of every `@sentry/*` SDK
 * (`@sentry/browser`, `@sentry/react`, `@sentry/react-native`)
 * consumed by any `@stackra/*` package. Every method routes 1:1
 * to the same-named export on the concrete SDK module, and every
 * signature is a superset of the SDK's real type — the concrete
 * modules are structurally assignable to `ISentryClient`.
 *
 * ## Defensive-probe pattern
 *
 * `@stackra/http`'s `MetricsInterceptor` reads Sentry from a
 * runtime global — the object might exist but not carry every
 * method (mid-load state, partial polyfill, non-Sentry namespace
 * squatter). Every call site there uses double optional chaining
 * (`sentry?.addBreadcrumb?.(...)`) to guard both the object
 * itself AND the method presence. TypeScript accepts optional
 * chaining on required properties, so declaring methods as
 * required here doesn't break that pattern — the runtime check
 * is still meaningful.
 *
 * ## Lazy-import pattern
 *
 * `@stackra/monitoring` + `@stackra/logger`'s Sentry reporters
 * `await import("@sentry/browser")` / `await import("@sentry/
 * react-native")` and narrow the resolved module to
 * `ISentryClient` before storing it. Every subsequent call
 * routes through single optional chaining
 * (`this.client?.captureException(...)`) — the client field is
 * nullable but its methods are guaranteed by the interface.
 *
 * @example Lazy-import an SDK and cache the client
 * ```typescript
 * import type { ISentryClient } from "@stackra/contracts";
 *
 * async function loadSentry(): Promise<ISentryClient | null> {
 *   try {
 *     const spec = "@sentry/react-native";
 *     const mod = (await import(spec)) as
 *       { default?: ISentryClient } | ISentryClient;
 *     return "default" in mod && mod.default
 *       ? mod.default
 *       : (mod as ISentryClient);
 *   } catch {
 *     return null;
 *   }
 * }
 * ```
 *
 * @example Probe a browser global defensively
 * ```typescript
 * import type { ISentryClient } from "@stackra/contracts";
 *
 * function getSentry(): ISentryClient | null {
 *   const g = globalThis as
 *     { Sentry?: ISentryClient; __SENTRY__?: ISentryClient };
 *   return g.Sentry ?? g.__SENTRY__ ?? null;
 * }
 *
 * const sentry = getSentry();
 * sentry?.addBreadcrumb?.({ message: "hello", category: "test" });
 * ```
 */
export interface ISentryClient {
  /**
   * Initialise the Sentry SDK. Idempotent per Sentry's own
   * contract — re-init on the same hub can leak options. Every
   * consumer that owns the SDK boot calls this once at first
   * use; probe consumers (like `@stackra/http`) never call it.
   *
   * @param options - Sentry init options. Shape mirrors the
   *   `Sentry.init(...)` overload consumers actually use (dsn,
   *   environment, release, tracesSampleRate, ...).
   */
  init(options: Record<string, unknown>): void;

  /**
   * Escalate a caught exception to Sentry.
   *
   * @param error - The exception. Sentry accepts any `unknown`
   *   value here.
   * @param hint - Optional capture context — tags, extras, level,
   *   componentStack. Routes into the Sentry event's structured
   *   payload.
   */
  captureException(error: unknown, hint?: Record<string, unknown>): void;

  /**
   * Escalate a message-only event to Sentry.
   *
   * @param message - The message payload.
   * @param captureContext - Optional level string OR structured
   *   context object. Sentry's browser SDK accepts either overload
   *   at runtime; the union keeps both call sites valid.
   */
  captureMessage(
    message: string,
    captureContext?: Record<string, unknown> | string,
  ): void;

  /**
   * Append a breadcrumb to Sentry's crash-context trail. Payload
   * shape is Sentry's own `Breadcrumb` type (message, category,
   * level, timestamp, data) but the interface widens to
   * `Record<string, unknown>` so consumers can pass either a
   * strongly-typed breadcrumb OR a loose object without a cast.
   *
   * @param breadcrumb - Breadcrumb payload. Timestamp values are
   *   in Unix SECONDS (floats), not millis — every consumer
   *   normalises before calling.
   */
  addBreadcrumb(breadcrumb: Record<string, unknown>): void;

  /**
   * Bind (or clear) the current user identity on Sentry's active
   * scope. Passing `null` clears the identity.
   */
  setUser(user: Record<string, unknown> | null): void;

  /**
   * Bind a keyed structured context on Sentry's active scope
   * (e.g. `"os"`, `"device"`, `"runtime"`, `"app"`). Passing
   * `null` clears the context under the key.
   *
   * Not on every Sentry SDK's public shape (`@sentry/browser`
   * ships it; some minimal builds don't) — consumers that route
   * through this optional method should still guard with `?.`.
   *
   * @param name - Context key.
   * @param context - Context payload, or `null` to clear.
   */
  setContext(name: string, context: Record<string, unknown> | null): void;

  /**
   * Flush any buffered events to Sentry. Bounded by an optional
   * timeout so a misbehaving transport can't stall shutdown.
   *
   * @param timeout - Max wait time in ms. Consumer default is
   *   `2000` — matches Sentry's own docs.
   * @returns A promise that resolves to `true` when the buffer
   *   drained, `false` on timeout.
   */
  flush(timeout?: number): Promise<boolean>;

  /**
   * Start a performance transaction. Only present on Sentry
   * SDKs with tracing support — every consumer that touches it
   * guards with `?.` at the call site. The nested return
   * (`setStatus?` + `finish?`) mirrors Sentry's browser-tracing
   * API surface, kept minimal because every workspace consumer
   * uses only these two methods on the transaction handle.
   *
   * @param descriptor - Transaction descriptor (name, op, ...).
   * @returns Transaction handle with `setStatus` + `finish`.
   */
  startTransaction?(descriptor: Record<string, unknown>): {
    setStatus?(status: string): void;
    finish?(): void;
  };
}
