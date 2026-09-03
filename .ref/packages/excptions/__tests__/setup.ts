/**
 * Jest Setup File
 *
 * Global test configuration and setup for the ORM package tests.
 * This file is loaded before each test suite runs.
 */

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set test timeout
jest.setTimeout(30000);

// Mock process.env
process.env.NODE_ENV = 'test';

// Setup global mocks that might be needed across tests
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Clean up after each test
  jest.resetAllMocks();
});
