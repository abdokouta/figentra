/**
 * @file index.ts
 * @module @stackra/config/testing
 * @description Mock implementation of IConfigService for testing.
 *   Provides an in-memory, assertable implementation that records all operations.
 */

import { createAssertableProxy } from '@stackra/testing';

class MockConfigService {
  private values: Record<string, unknown>;

  constructor(values: Record<string, unknown> = {}) {
    this.values = { ...values };
  }

  get<T = unknown>(key: string, defaultValue?: T): T {
    const parts = key.split('.');
    let current: unknown = this.values;
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object')
        return defaultValue as T;
      current = (current as Record<string, unknown>)[part];
    }
    return (current as T) ?? (defaultValue as T);
  }

  set(key: string, value: unknown): void {
    const parts = key.split('.');
    let current: Record<string, unknown> = this.values;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in current) || typeof current[parts[i]] !== 'object') current[parts[i]] = {};
      current = current[parts[i]] as Record<string, unknown>;
    }
    current[parts[parts.length - 1]] = value;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }
}

/**
 * Create an assertable mock for IConfigService.
 *
 * @returns Assertable mock with call recording and assertion methods
 */
export function createMockConfig() {
  return createAssertableProxy(new MockConfigService());
}

export { MockConfigService };
