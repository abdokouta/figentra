/**
 * @file tsup.config.ts
 * @module @stackra/testing/tsup
 * @description Build config for `@stackra/testing` — emits every subpath
 *   listed in `package.json.exports` as a dual-format ESM+CJS bundle
 *   with declarations.
 *
 *   Entries map subpath → source file. tsup writes each to
 *   `dist/<key>.{js,mjs,d.ts}` — the key path becomes the folder
 *   structure inside `dist/`, so `core/index` lands at
 *   `dist/core/index.{js,mjs,d.ts}` and matches the exports map.
 *
 *   Every peer dependency is external — `@cloudflare/vitest-pool-workers`,
 *   `miniflare`, `@electric-sql/pglite`, `@testing-library/*`, `vitest`,
 *   `@nestjs/*`, etc. — the base config auto-externalises anything in
 *   `dependencies` + `peerDependencies`. tsup would otherwise inline
 *   them, breaking cross-package DI identity and bloating the bundle.
 */

import { defineBaseConfig } from "@stackra/tsup-config";

export default defineBaseConfig(
  {
    "core/index": "src/core/index.ts",
    "preset/base": "src/preset/base.ts",
    "preset/nest": "src/preset/nest.ts",
    "preset/worker": "src/preset/worker.ts",
    "preset/react": "src/preset/react.ts",
    "matchers/index": "src/matchers/index.ts",
    "setup/index": "src/setup/index.ts",
    "nest/index": "src/nest/index.ts",
    "worker/index": "src/worker/index.ts",
    "database/index": "src/database/index.ts",
    "react/index": "src/react/index.ts",
    "react/setup": "src/react/setup.ts",
  },
  {
    dts: true,
    // Every optional peer is externalised by default because it lives in
    // `peerDependencies`; the block below documents the intent for
    // reviewers reading the config in isolation.
    external: [
      "@cloudflare/vitest-pool-workers",
      "@electric-sql/pglite",
      "@faker-js/faker",
      "@mikro-orm/core",
      "@mikro-orm/nestjs",
      "@nestjs/common",
      "@nestjs/core",
      "@nestjs/platform-fastify",
      "@nestjs/testing",
      "@testing-library/jest-dom",
      "@testing-library/react",
      "@testing-library/user-event",
      "@vitest/coverage-v8",
      "fastify",
      "jsdom",
      "miniflare",
      "react",
      "react-dom",
      "reflect-metadata",
      "supertest",
      "unplugin-swc",
      "vite-tsconfig-paths",
      "vitest",
      "vitest/config",
    ],
  },
);
