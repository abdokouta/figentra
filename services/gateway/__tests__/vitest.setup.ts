/** @file vitest.setup.ts @description Shared Gateway test setup. */
import { beforeEach, vi } from "vitest";

/** Reset mocks between tests to prevent cross-test state leakage. */
beforeEach(() => vi.restoreAllMocks());
