/**
 * @file index.ts
 * @module @stackra/container/testing/test-container-provider
 * @description Public API barrel for the `test-container-provider`
 *   category — a lightweight React provider that mounts a
 *   {@link MockApplication} into {@link ContainerContext} for unit
 *   tests that use `useInject(...)`.
 */

export {
  TestContainerProvider,
  type ITestContainerProviderProps,
} from "./test-container-provider.provider";
