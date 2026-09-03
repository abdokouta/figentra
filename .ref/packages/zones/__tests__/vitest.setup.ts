/**
 * @file vitest.setup.ts
 * @module @stackra/zones/__tests__
 * @description Vitest setup — runs before every test module in this
 *   package.
 *
 *   Imports the workspace's shared `@stackra/testing/setup` (mock /
 *   fake-timer restore hook) and adds jsdom polyfills the zones test
 *   suite needs:
 *
 *   - `window.matchMedia` — HeroUI Pro's `Sheet` component's
 *     `use-scale-background` hook calls it at module load time.
 *     jsdom doesn't ship it. Every test that transitively imports
 *     `@stackra/ui/react` hits the missing API even when the test
 *     itself doesn't render a `Sheet`.
 *   - `IntersectionObserver` + `ResizeObserver` — HeroUI Pro
 *     compound components use them for viewport-aware behaviour.
 *     Cheap no-op stubs keep the imports quiet.
 *
 *   The polyfills are per-package (rather than upstreamed into the
 *   testing preset) because most `@stackra/*` packages test at
 *   `environment: "node"` — they don't need jsdom and would pay a
 *   cost for globals they never use.
 */

import "@stackra/testing/setup";

// ── window.matchMedia — HeroUI Pro Sheet dependency ─────────────
// A minimal but complete MediaQueryList shape. Every field on the
// spec is present so libraries that dereference (`.matches`) OR
// register listeners (`.addEventListener`, `.addListener`) succeed
// silently. The stub always reports `matches: false` — nothing in
// the zones panel logic exercises media queries.
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string): MediaQueryList =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  });
}

// ── IntersectionObserver — cheap no-op ──────────────────────────
if (
  typeof window !== "undefined" &&
  typeof window.IntersectionObserver !== "function"
) {
  class NoopIntersectionObserver {
    public constructor() {}
    public observe(): void {}
    public unobserve(): void {}
    public disconnect(): void {}
    public takeRecords(): unknown[] {
      return [];
    }
    public readonly root = null;
    public readonly rootMargin = "";
    public readonly thresholds: readonly number[] = [];
  }
  (
    window as unknown as { IntersectionObserver: unknown }
  ).IntersectionObserver = NoopIntersectionObserver;
}

// ── ResizeObserver — cheap no-op ────────────────────────────────
if (
  typeof window !== "undefined" &&
  typeof window.ResizeObserver !== "function"
) {
  class NoopResizeObserver {
    public constructor() {}
    public observe(): void {}
    public unobserve(): void {}
    public disconnect(): void {}
  }
  (window as unknown as { ResizeObserver: unknown }).ResizeObserver =
    NoopResizeObserver;
}
