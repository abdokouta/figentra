/// <reference types="vite/client" />

/**
 * @file vite-env.d.ts
 * @module @stackra/dashboard
 * @description Ambient declarations for Vite build-time constants
 *   defined in `vite.config.ts` via `define: { ... }`.
 */

/**
 * The workspace `package.json` version, inlined by Vite at build
 * time. Consumers set the `X-Client: stackra-dashboard/<v>`
 * header off it.
 */
declare const __APP_VERSION__: string;

/**
 * Absolute filesystem path to the project root, inlined by Vite at
 * build time. Read once at boot via
 * `Path.setRoot(__STACKRA_ROOT__)` in `main.tsx` so the browser
 * never touches `node:fs`.
 */
declare const __STACKRA_ROOT__: string;

/**
 * `virtual:i18n/translations` — synthetic module emitted by the
 * `i18nPlugin` from `@stackra/i18n/vite`. Collects every
 * `<@stackra-pkg>/src/core/i18n/*.json` catalog under
 * `node_modules/` plus every app-level catalog under
 * `./src/i18n/*.json` and exposes the merged record as one import.
 *
 * See `src/config/i18n.config.ts` — that factory hands the
 * `translations` export to `StaticLoader` via `loaderOptions` on
 * the `WebI18nModule.forRoot(...)` config.
 */
declare module "virtual:i18n/translations" {
  /** Locale-keyed nested translations record. */
  export const translations: Record<string, Record<string, unknown>>;
  /** BCP-47 locales the plugin discovered a catalog for. */
  export const supportedLocales: readonly string[];
}
