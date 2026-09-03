/**
 * @file vitest.config.ts
 * @module @stackra/zones/test
 * @description Vitest configuration for @stackra/zones.
 *
 *   Merges the shared workspace preset with a jsdom test environment
 *   (React component tests) and a per-package `@/` path alias. `oxc`
 *   + `esbuild` are explicitly disabled to preserve decorator
 *   metadata emission — Vitest 4's default OXC transformer strips
 *   the `emitDecoratorMetadata` channel `@stackra/container` relies
 *   on for constructor-parameter DI resolution.
 *
 *   `setupFiles` points at `./__tests__/vitest.setup.ts` which
 *   polyfills `window.matchMedia` + `IntersectionObserver` +
 *   `ResizeObserver` — HeroUI Pro's `Sheet` compound calls
 *   `matchMedia` at module-load time and jsdom does not ship it.
 */
import { defineConfig, mergeConfig } from "vitest/config";
import path from "node:path";
import preset from "@stackra/testing/preset";

export default mergeConfig(
  preset,
  defineConfig({
    // Preserve decorator metadata — the container reads it at boot.
    oxc: false,
    esbuild: false,
    test: {
      environment: "jsdom",
      setupFiles: ["./__tests__/vitest.setup.ts"],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }),
);
