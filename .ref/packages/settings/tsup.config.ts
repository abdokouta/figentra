/**
 * @file tsup.config.ts
 * @module @stackra/settings/build
 * @description tsup build configuration for `@stackra/settings`.
 *
 *   Four entries — `.` (module + services + registry + config +
 *   stores + decorators + i18n), `./react` (hooks + components +
 *   pages + routes + providers), `./native` (RN screens + rows +
 *   navigation helper + AsyncStorageSettingsStore), and `./testing`
 *   (mock services + registry + store). Every entry emits ESM + CJS
 *   + DTS via the workspace's canonical `defineBaseConfig`.
 */

import { defineBaseConfig } from "@stackra/tsup-config";

export default defineBaseConfig(
  {
    index: "src/core/index.ts",
    react: "src/react/index.ts",
    native: "src/native/index.ts",
    testing: "src/testing/index.ts",
    config: "config/settings.config.ts",
  },
  {
    // React + reflect-metadata are optional peers — never bundle
    // them. Downstream apps ship their own copies. `@stackra/ui` and
    // every other workspace peer are external via the base config;
    // nothing to do here.
    //
    // React Native + HeroUI Native + React Navigation are RN-only
    // optional peers that only the `./native` subpath consumes. Mark
    // them external so Metro / consumers ship their own copies (the
    // base config's default excludes are React-web focused).
    external: [
      "@react-navigation/native",
      "@react-native-async-storage/async-storage",
      "heroui-native",
      "heroui-native-pro",
      "react",
      "react-dom",
      "react-native",
      "react-native-safe-area-context",
      "reflect-metadata",
    ],
  },
);
