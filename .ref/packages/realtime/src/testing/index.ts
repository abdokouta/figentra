/**
 * @file index.ts
 * @module @stackra/realtime/testing
 * @description Mock implementation of IRealtimeManager for testing.
 *   Provides an in-memory, assertable implementation that records all operations.
 */

import { createAssertableProxy } from '@stackra/testing';

class MockRealtimeManager {
  private broadcasts: Array<{ channel: string; event: string; data?: unknown }> = [];

  async broadcast(channel: string, event: string, data?: unknown): Promise<void> {
    this.broadcasts.push({ channel, event, data });
  }

  async join(_channel: string): Promise<void> {}
  async leave(_channel: string): Promise<void> {}

  getBroadcasts() {
    return [...this.broadcasts];
  }
  clearBroadcasts(): void {
    this.broadcasts = [];
  }
}

/**
 * Create an assertable mock for IRealtimeManager.
 *
 * @returns Assertable mock with call recording and assertion methods
 */
export function createMockRealtime() {
  return createAssertableProxy(new MockRealtimeManager());
}

export { MockRealtimeManager };
