/**
 * @file index.ts
 * @module @stackra/queue/testing
 * @description Mock implementation of IQueueManager for testing.
 *   Provides an in-memory, assertable implementation that records all operations.
 */

import { createAssertableProxy } from '@stackra/testing';

class MockQueueManager {
  private dispatchedJobs: Array<{ job: string; data?: unknown; queue?: string }> = [];

  async dispatch(job: string, data?: unknown, queue?: string): Promise<string> {
    const id = `job_${this.dispatchedJobs.length + 1}`;
    this.dispatchedJobs.push({ job, data, queue });
    return id;
  }

  async schedule(job: string, data: unknown, _delay: number): Promise<string> {
    return this.dispatch(job, data);
  }

  getDispatchedJobs(): Array<{ job: string; data?: unknown; queue?: string }> {
    return [...this.dispatchedJobs];
  }

  clearDispatchedJobs(): void {
    this.dispatchedJobs = [];
  }
}

/**
 * Create an assertable mock for IQueueManager.
 *
 * @returns Assertable mock with call recording and assertion methods
 */
export function createMockQueue() {
  return createAssertableProxy(new MockQueueManager());
}

export { MockQueueManager };
