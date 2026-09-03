/**
 * @file index.ts
 * @module @stackra/testing/react
 * @description Public API barrel for the React test toolkit.
 *
 *   Re-exports:
 *
 *   - `customRender` / `render` — workspace-canonical RTL render.
 *   - `screen`, `waitFor`, `within`, `fireEvent`, `act` — every
 *     symbol consumers routinely reach for from
 *     `@testing-library/react`.
 *   - `userEvent` — default export from
 *     `@testing-library/user-event` (the recommended interaction
 *     helper for React 19).
 *
 *   Consumers `import { customRender, screen, userEvent } from
 *   "@stackra/testing/react"` and never touch the underlying
 *   testing-library packages directly.
 *
 *   The `/setup` file is exported at
 *   `@stackra/testing/react/setup` — referenced from
 *   `preset/react.ts` — NOT here.
 */

// ── Render helpers ────────────────────────────────────────────────
export { customRender, render, type ICustomRenderOptions } from "./render";

// ── RTL re-exports ────────────────────────────────────────────────
//
// Every symbol below is workspace-canonical for React component
// tests. Grouped by purpose.

// Queries + waiting
export {
  screen,
  within,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";

// Event dispatch (imperative — prefer `userEvent` for user flows)
export { fireEvent, act } from "@testing-library/react";

// User interaction (canonical — matches how a real user drives the UI)
export { default as userEvent } from "@testing-library/user-event";

// Types authors reach for
export type {
  RenderOptions,
  RenderResult,
  RenderHookOptions,
  RenderHookResult,
} from "@testing-library/react";
