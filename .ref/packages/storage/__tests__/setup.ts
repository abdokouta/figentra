/**
 * Jest test setup file.
 *
 * This file is executed before running tests and sets up the testing
 * environment, including global mocks, configurations, and utilities.
 */

// Set test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
