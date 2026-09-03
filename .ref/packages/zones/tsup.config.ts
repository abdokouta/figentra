/**
 * @file tsup.config.ts
 * @module @stackra/zones/build
 * @description tsup build configuration for `@stackra/zones`.
 *
 *   Four entries: `.` (core: `ZonesModule`, `ZoneRegistry`,
 *   `resolveZoneOrder`, cross-platform types), `./react` (web
 *   `<Zone>` / `<FormFieldZone>` / `<TableColumnZone>` +
 *   `useZone` / `useZoneContext`), `./native` (RN counterparts),
 *   `./testing` (in-memory `MockZoneRegistry` + provider). Every
 *   entry emits ESM + CJS + DTS via the workspace's canonical
 *   `defineBaseConfig`.
 *
 *   The `external` overrides below list the RN-only optional peers
 *   the `./native` subpath imports. Marking them external prevents
 *   the web bundle from pulling RN code into browser output; native
 *   consumers resolve them themselves via Metro.
 */

import { defineBaseConfig } from "@stackra/tsup-config";

export default defineBaseConfig(
  {
    index: "src/core/index.ts",
    react: "src/react/index.ts",
    native: "src/native/index.ts",
    testing: "src/testing/index.ts",
  },
  {
    external: [
      // RN + optional peers — only consumed by the `./native` subpath.
      "react",
      "react-dom",
      "react-native",
      "reflect-metadata",
    ],
    dts: true, // @heroui-pro/react ships broken exports.types
  },
);
