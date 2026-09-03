/**
 * @file example.test.ts
 * @description Example unit test for @stackra/nestjs-webhook.
 *
 *   Placeholder verifying the testing infrastructure boots. Replace with real
 *   unit tests as the package's public API grows.
 *
 *   Unit tests should:
 *   - Test a single class or function in isolation
 *   - Mock all external dependencies
 *   - Run instantly (no async I/O, no real timers)
 *   - Follow the naming convention: `{class-name}.test.ts`
 *
 *   For tests that require the DI container, use the `feature/` folder
 *   instead.
 *
 * @example
 * ```bash
 * yarn workspace @stackra/nestjs-webhook test
 * ```
 */

import { describe, it, expect } from 'vitest';

describe('@stackra/nestjs-webhook', () => {
  it('boots the test environment', () => {
    expect(true).toBe(true);
  });
});
