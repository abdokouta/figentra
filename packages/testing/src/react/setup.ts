/**
 * @file setup.ts
 * @module @stackra/testing/react
 * @description Side-effect setup file for React tests. Referenced
 *   from `preset/react.ts` via `setupFiles: ["@stackra/testing/react/setup"]`.
 *
 *   Responsibilities:
 *
 *   1. Extend `expect()` with `@testing-library/jest-dom` matchers
 *      (`toBeInTheDocument`, `toHaveClass`, `toBeVisible`, ...).
 *   2. Register `afterEach(cleanup)` — unmounts every rendered
 *      component and detaches every listener, preventing DOM leaks
 *      between tests.
 *   3. Register the workspace's own matchers (via the core setup).
 */

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Import-for-side-effect — `@testing-library/jest-dom/vitest` calls
// `expect.extend({...})` at module load with every DOM matcher.
import "@testing-library/jest-dom/vitest";

// Chain the core setup too — arms custom matchers + time cleanup so
// consumers only need ONE setupFiles entry.
import "../setup";

// Unmount every rendered tree after each test — RTL's canonical
// cleanup. Without this, DOM nodes accumulate + event listeners
// leak across tests, causing weird action-at-a-distance failures.
afterEach(() => {
  cleanup();
});
