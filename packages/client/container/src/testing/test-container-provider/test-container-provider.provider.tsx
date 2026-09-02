/**
 * @file test-container-provider.provider.tsx
 * @module @stackra/container/testing
 * @description `<TestContainerProvider providers={...}>` — a
 *   lightweight React provider that mounts a {@link MockApplication}
 *   into the {@link ContainerContext} so consumer components can
 *   call `useInject(Token)` in unit tests without spinning up the
 *   full `ApplicationFactory.create()` graph.
 *
 *   ## Why this composes `ContainerProvider` (not raw `ContainerContext.Provider`)
 *
 *   Composing the existing `ContainerProvider` (from `./react`)
 *   keeps the fixture aligned with the production wiring. Both
 *   paths ultimately write to `ContainerContext`, but going through
 *   `ContainerProvider` inherits its runtime guards (`null` context
 *   throws a helpful error) and stays 1:1 with what consumers
 *   normally mount.
 *
 *   The container package's `tsup.config.ts` sets `splitting: true`
 *   so `ContainerContext` is emitted into a dedicated chunk shared
 *   by `react.mjs` + `testing.mjs` — one runtime instance across
 *   both subpaths. Without that setting, tsup would inline separate
 *   `createContext(null)` calls into each bundle and consumer
 *   `useInject` would silently fail against a mismatched context.
 *
 *   ## Contract
 *
 *   - Consumers pass a list of `[token, value]` tuples via the
 *     `providers` prop. Each pair is registered on a fresh
 *     {@link MockApplication} that's memoised for the provider's
 *     lifetime (a re-render of the test wrapper does NOT rebuild
 *     the container — the same in-memory instance survives).
 *   - Alternatively, callers pass a pre-built {@link IMockApplication}
 *     via the `application` prop. The `providers` list (if any) is
 *     merged into it. Use this when the spec needs to spy on
 *     `provide` / `has` / `get` via {@link createMockApplication}'s
 *     `AssertableProxy` wrapper.
 *   - The `MockApplication` is cast to `ApplicationContext` at the
 *     `ContainerProvider` boundary. `useInject()` only calls
 *     `.get(token)` — the cast is safe for the intended use case.
 *     Test doubles that reach for `.select(Module)` / `.getContainer()`
 *     etc. will fail against the mock, which is correct (those APIs
 *     are not part of the "resolve a provider" contract this
 *     fixture supports).
 *
 *   ## When to use this
 *
 *   Use `<TestContainerProvider>` when the component-under-test
 *   calls `useInject(...)` inside its render body. The alternative
 *   — a real `ApplicationFactory.create()` bootstrap — is heavier
 *   and needs an async `waitFor(...)` before assertions can run.
 *
 *   For rendering a subtree that transitively resolves a live DI
 *   graph (e.g. a package's own `TestXProvider` that composes
 *   `XModule.forRoot(...)`), reach for that TestXProvider directly
 *   — it already handles the async bootstrap. This fixture is for
 *   the case where the consumer just needs a couple of tokens
 *   resolved to fake instances.
 *
 *   @example
 *   ```tsx
 *   import { render } from "@testing-library/react";
 *   import { TestContainerProvider } from "@stackra/container/testing";
 *   import { WidgetCatalogueService } from "@stackra/dashboard";
 *   import { WidgetGrid } from "@stackra/dashboard/react";
 *
 *   test("renders the widget grid", () => {
 *     const catalogue = new WidgetCatalogueService(...);
 *     render(
 *       <TestContainerProvider providers={[[WidgetCatalogueService, catalogue]]}>
 *         <WidgetGrid />
 *       </TestContainerProvider>,
 *     );
 *   });
 *   ```
 *
 *   @example
 *   ```tsx
 *   // Spy on provide/get via createMockApplication's assertable proxy.
 *   import { createMockApplication, TestContainerProvider }
 *     from "@stackra/container/testing";
 *
 *   const app = createMockApplication();
 *   render(
 *     <TestContainerProvider application={app}
 *                            providers={[[LOGGER, mockLogger]]}>
 *       <ComponentUnderTest />
 *     </TestContainerProvider>,
 *   );
 *   expect(app.$.wasCalledWith("get", LOGGER)).toBe(true);
 *   ```
 */

import { useMemo, type ReactElement, type ReactNode } from "react";

import { MockApplication, type IMockApplication } from "../mock-application";

import type { ApplicationContext } from "../../core/application/application-context.service";

import { ContainerProvider } from "../../core/providers/container/container.provider";

/** Props for {@link TestContainerProvider}. */
export interface ITestContainerProviderProps {
  /**
   * Providers to register on the mock container as `[token, value]`
   * tuples. Tokens can be classes, symbols, or strings — same
   * contract as {@link MockApplication.provide}.
   */
  readonly providers?: readonly (readonly [unknown, unknown])[];

  /**
   * Optional pre-built {@link IMockApplication}. When supplied, the
   * `providers` list is merged INTO it (via `.provide(...)`), so
   * both bindings ship inside the same registry. Useful for specs
   * that need to share the container across renders OR assert on
   * `provide` / `get` / `has` calls via {@link createMockApplication}'s
   * `AssertableProxy` wrapper.
   */
  readonly application?: IMockApplication;

  /** The subtree under test. */
  readonly children: ReactNode;
}

/**
 * Test-scoped React provider — binds a {@link MockApplication} into
 * the container's {@link ContainerContext} (via `ContainerProvider`)
 * so `useInject(Token)` inside the subtree resolves against the
 * caller's `[token, value]` pairs.
 *
 * @param props - See {@link ITestContainerProviderProps}.
 * @returns A React element wrapping `children` in the container
 *   context.
 *
 * @example
 * ```tsx
 * <TestContainerProvider providers={[[LOGGER, mockLogger]]}>
 *   <MyComponent />
 * </TestContainerProvider>
 * ```
 */
export function TestContainerProvider(
  props: ITestContainerProviderProps,
): ReactElement {
  const { providers, application, children } = props;

  // Memoise the container so re-renders of the test wrapper don't
  // reset in-progress mutations. The `MockApplication` instance is
  // stable across the test's lifetime — matching the memoisation
  // pattern in TestDashboardProvider / TestKbdProvider.
  //
  // The `providers` / `application` values are deliberately not in
  // the deps array — swapping them mid-test would blow away every
  // registered value and re-notify subscribers on a stale ref. If
  // a spec needs a different container, remount the whole tree.
  const app = useMemo(() => {
    const instance = application ?? new MockApplication();
    if (providers) {
      for (const [token, value] of providers) {
        instance.provide(token as never, value);
      }
    }
    return instance;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- test wrapper: container is created once per mount
  }, []);

  // Cast at the ContainerProvider boundary — `MockApplication`
  // implements the subset of `ApplicationContext` the `useInject`
  // hook actually consumes (`.get(token)`). Tests that reach for
  // the fuller surface (`select`, `getContainer`, `close`, ...)
  // will fail loud, which is the correct signal that the fixture
  // isn't the right tool for that spec.
  return (
    <ContainerProvider context={app as unknown as ApplicationContext}>
      {children}
    </ContainerProvider>
  );
}

TestContainerProvider.displayName = "TestContainerProvider";
