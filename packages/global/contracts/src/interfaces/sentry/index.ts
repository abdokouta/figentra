/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/sentry
 * @description Barrel for the Sentry SDK / probe contract.
 *
 *   The `sentry` folder holds a single structural narrowing of the
 *   `@sentry/*` SDK surface consumed by every `@stackra/*` package
 *   that forwards signal into Sentry — whether via a browser
 *   global probe (`@stackra/http`) or a lazy-imported SDK module
 *   (`@stackra/monitoring`, `@stackra/logger`). Sibling third-party
 *   narrowings live under `../navigation` (React Navigation),
 *   `../app-state` (RN AppState), and `../appearance` (RN
 *   Appearance).
 */

export type { ISentryClient, SentryLevel } from "./sentry-client.interface";
