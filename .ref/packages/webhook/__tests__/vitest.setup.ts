/**
 * @file vitest.setup.ts
 * @description Vitest global setup. Runs once before every test file.
 *
 *   Imports the shared DI mocking and lifecycle helpers from
 *   `@stackra/testing/setup`. Add package-specific setup below the import
 *   if needed (e.g., custom matchers, test data fixtures, console spies).
 *
 * @see @stackra/testing/setup
 */

import '@stackra/testing/setup';
