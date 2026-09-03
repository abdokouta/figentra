/**
 * @file vitest.setup.ts
 * @description Local test setup for @stackra/testing's own suite.
 *   Dogfoods `src/setup/index.ts` — the same side-effect entry
 *   consumers import via `@stackra/testing/setup`.
 */

// Registers custom matchers + afterEach time cleanup.
import "../src/setup";
