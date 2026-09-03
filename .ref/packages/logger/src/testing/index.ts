/**
 * @file index.ts
 * @module @stackra/logger/testing
 * @description Mock implementation of ILoggerManager for testing.
 *   Provides an in-memory, assertable implementation that records all operations.
 */

import { createAssertableProxy } from '@stackra/testing';

class MockLogger {
  private logs: Array<{ level: string; message: string; data?: unknown }> = [];

  debug(message: string, data?: unknown): void {
    this.logs.push({ level: 'debug', message, data });
  }
  info(message: string, data?: unknown): void {
    this.logs.push({ level: 'info', message, data });
  }
  warn(message: string, data?: unknown): void {
    this.logs.push({ level: 'warn', message, data });
  }
  error(message: string, data?: unknown): void {
    this.logs.push({ level: 'error', message, data });
  }

  getLogs(): Array<{ level: string; message: string; data?: unknown }> {
    return [...this.logs];
  }
  getLogsByLevel(level: string) {
    return this.logs.filter((l) => l.level === level);
  }
  clearLogs(): void {
    this.logs = [];
  }
  create(_context: string) {
    return this;
  }
}

/**
 * Create an assertable mock for ILoggerManager.
 *
 * @returns Assertable mock with call recording and assertion methods
 */
export function createMockLogger() {
  return createAssertableProxy(new MockLogger());
}

export { MockLogger };
