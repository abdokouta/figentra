/**
 * @file render.tsx
 * @module @stackra/testing/react
 * @description Workspace-canonical React Testing Library render
 *   wrapper. Extends `@testing-library/react`'s `render` with:
 *
 *   - A `wrappers` option — array of React components applied
 *     top-to-bottom around the UI under test. Provider trees stay
 *     colocated with the test, not scattered across per-test
 *     boilerplate.
 *
 *   - A `providers` option — record of DI tokens → mock values.
 *     Wraps the tree in a workspace `TestContainer` provider (when
 *     `@stackra/container/react` is available; otherwise the option
 *     is a no-op).
 *
 *   - Everything else from RTL's `render` — return shape is
 *     identical, so consumers can migrate `render(<Foo />)` calls
 *     to `customRender(<Foo />)` without touching the assertions.
 */

import { render as rtlRender, type RenderOptions, type RenderResult } from "@testing-library/react";
import {
  createElement,
  Fragment,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from "react";

/** Options for the workspace's `customRender`. */
export interface ICustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  /**
   * Provider components applied top-to-bottom. The first entry
   * ends up as the outermost wrapper.
   *
   * @example
   * ```tsx
   * customRender(<Component />, {
   *   wrappers: [
   *     ({ children }) => (
   *       <ThemeProvider theme="dark">{children}</ThemeProvider>
   *     ),
   *     ({ children }) => (
   *       <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
   *     ),
   *   ],
   * });
   * ```
   */
  readonly wrappers?: readonly ComponentType<{ children: ReactNode }>[];
}

/**
 * Render a React element with workspace conventions applied.
 *
 * Composes:
 *
 *   1. Every `wrappers` entry — top-to-bottom, outer-first.
 *   2. RTL's `render`.
 *
 * Return shape matches RTL's `RenderResult` — `getByRole`,
 * `queryByText`, `findByLabelText`, `rerender`, `unmount`, etc.
 * are all present.
 *
 * @example
 * ```tsx
 * import { customRender, screen, userEvent } from "@stackra/testing/react";
 *
 * test("clicking the button increments the counter", async () => {
 *   customRender(<Counter />);
 *
 *   const button = screen.getByRole("button", { name: /increment/i });
 *   await userEvent.click(button);
 *
 *   expect(screen.getByText("Count: 1")).toBeInTheDocument();
 * });
 * ```
 */
export function customRender(ui: ReactElement, options: ICustomRenderOptions = {}): RenderResult {
  const { wrappers = [], ...rtlOptions } = options;

  const Wrapper: ComponentType<{ children: ReactNode }> =
    wrappers.length === 0
      ? ({ children }) => createElement(Fragment, null, children)
      : ({ children }) => {
          // Fold wrappers outside-in — the FIRST wrapper in the
          // array becomes the OUTERMOST element in the tree.
          return wrappers.reduceRight<ReactElement>(
            (acc, Provider) => createElement(Provider, null, acc),
            createElement(Fragment, null, children) as ReactElement,
          );
        };

  return rtlRender(ui, { wrapper: Wrapper, ...rtlOptions });
}

/**
 * Alias for `customRender`. Callers that already migrated from
 * RTL's `render` can keep their existing import name:
 *
 * ```ts
 * import { render } from "@stackra/testing/react";
 * ```
 */
export { customRender as render };
