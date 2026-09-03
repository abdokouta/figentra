/**
 * @file tsup.config.ts
 * @module @stackra/container/tsup
 * @description Build config for @stackra/container.
 *
 *   ## `splitting: true`
 *
 *   The container ships THREE entries — `.` (core), `./react`, and
 *   `./testing` — that share code:
 *
 *   - `./react` binds `ContainerContext` for consumer hooks.
 *   - `./testing` mounts a `MockApplication` INTO that same context
 *     via `<TestContainerProvider>`.
 *
 *   When tsup builds with `splitting: false` (the workspace
 *   default), each entry inlines its own copy of every imported
 *   module. That's fine for pure-data modules, but disastrous for
 *   `ContainerContext` — the two dist bundles end up with SEPARATE
 *   `createContext(null)` calls, so a `<TestContainerProvider>`
 *   from `dist/testing.mjs` writes to a different React context
 *   than the one `useInject` from `dist/react.mjs` reads. Consumer
 *   tests silently break: the fixture appears to mount but every
 *   `useInject(Token)` throws `useContainer() must be used within
 *   a <ContainerProvider>`.
 *
 *   `splitting: true` fixes this by emitting shared modules into
 *   dedicated chunks that ALL entries import from — one runtime
 *   instance across the react + testing subpaths.
 */

import { defineBaseConfig } from "@stackra/tsup-config";

export default defineBaseConfig(
  {
    index: "src/core/index.ts",
    react: "src/react/index.ts",
    native: "src/native/index.ts",
    worker: "src/worker/index.ts",
    testing: "src/testing/index.ts",
  },
  {
    // Emit shared modules (notably `ContainerContext`) into dedicated
    // chunks so `react` + `testing` reference the SAME runtime
    // instance. See the top-of-file docblock for the reasoning.
    splitting: true,
    // Emit `.d.ts` alongside every entry — @stackra/container is a
    // core DI framework every downstream consumer types against.
    // Container does not import from `@heroui-pro/react`, so the
    // workspace-wide dts-broken workaround does not apply here.
    dts: true,
  },
);
