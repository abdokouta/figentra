/**
 * @file index.ts
 * @module @stackra/testing
 * @description Top-level public API for `@stackra/testing`.
 *
 *   Re-exports every symbol from every category:
 *
 *   - `assertable/` — `createAssertableProxy`, `AssertableProxy`,
 *     `IAssertionApi`, `IRecordedCall`.
 *   - `container/` — `TestContainer`, `createTestContainer`,
 *     `ITestContainer`.
 *   - `factories/` — `defineFactory`, `Rng`, `Sequence`,
 *     factory interfaces.
 *   - `time/` — `freezeTime`, `travelTo`, `travelBy`,
 *     `restoreTime`, `now`.
 *   - `ids/` — `createUlidGenerator`.
 *
 *   Subpath-specific helpers (`/preset`, `/matchers`, `/setup`,
 *   `/nest`, `/worker`, `/database`, `/react`) live in their own
 *   subpath barrels — this entry never re-exports them so
 *   consumers who only need the core toolkit don't pull in
 *   NestJS/Miniflare/PGlite/RTL peers.
 */

export * from "./assertable";
export * from "./container";
export * from "./factories";
export * from "./ids";
export * from "./time";
