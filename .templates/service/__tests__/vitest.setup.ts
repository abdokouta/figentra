/**
 * @file vitest.setup.ts
 * @description Canonical test lifecycle setup for the {{SLUG}} service.
 *   Imports `@stackra/testing/setup` for deterministic test isolation
 *   (timer mocks, spy restoration, env-var stubs) per ADR-0087.
 */

import "@stackra/testing/setup";
