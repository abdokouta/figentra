/**
 * @file example.test.ts
 * @description Example feature test for @stackra/nestjs-webhook.
 *
 *   Placeholder for integration/feature tests that exercise the DI container.
 *   Replace with real feature tests once the module's public API is defined.
 *
 *   Feature tests should:
 *   - Use `createTestContainer()` from `@stackra/testing` to bootstrap
 *     a minimal DI container
 *   - Test real service interactions (do not mock internal collaborators)
 *   - Mock only the boundaries: HTTP clients, external APIs, browser/native APIs
 *   - Clean up with `container.destroy()` in `afterEach`
 *
 * @example
 * ```typescript
 * import { createTestContainer } from '@stackra/testing';
 *
 * const container = await createTestContainer({
 *   providers: [{ provide: MyService, useClass: MyService }],
 * });
 * const svc = container.get(MyService);
 * ```
 */

import { describe, it, expect } from 'vitest';

describe('@stackra/nestjs-webhook — Feature', () => {
  it('boots the feature test environment', () => {
    expect(true).toBe(true);
  });
});
