/**
 * @file index.ts
 * @module @stackra/container/testing
 * @description Public API for `@stackra/container/testing`.
 *
 *   Assertable mock application context (`IApplication`) for unit tests
 *   that inject `APPLICATION` or interact with the DI container, plus
 *   a lightweight React provider that mounts the mock into
 *   `ContainerContext` so component tests can call `useInject(Token)`
 *   without spinning up the full `ApplicationFactory.create()` graph.
 *
 *   Follows the standard testing pattern used across the Stackra monorepo:
 *   - `mock-*.ts` — in-memory implementations of the interface contracts
 *   - `create-mock-*.ts` — factories that wrap mocks in `createAssertableProxy`
 *   - `test-*-provider/` — React providers that mount a mock into the
 *     production context so `useInject` / `useContainer` resolve
 *   - `index.ts` — barrel re-exports
 *
 * @example
 * ```ts
 * import { createMockApplication } from '@stackra/container/testing';
 * import { LOGGER } from '@stackra/logger';
 * import { createMockLogger } from '@stackra/logger/testing';
 *
 * const logger = createMockLogger();
 * const app = createMockApplication([[LOGGER, logger]]);
 * expect(app.get(LOGGER)).toBe(logger);
 * ```
 *
 * @example
 * ```tsx
 * import { render } from "@testing-library/react";
 * import { TestContainerProvider } from "@stackra/container/testing";
 * import { WidgetCatalogueService } from "@stackra/dashboard";
 *
 * render(
 *   <TestContainerProvider providers={[[WidgetCatalogueService, fakeCatalogue]]}>
 *     <WidgetGrid />
 *   </TestContainerProvider>,
 * );
 * ```
 */

export { MockApplication, type IMockApplication } from "./mock-application";
export { createMockApplication } from "./create-mock-application";
export {
  TestContainerProvider,
  type ITestContainerProviderProps,
} from "./test-container-provider";
