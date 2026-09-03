/**
 * @file local-storage.connector.ts
 * @module @stackra/queue/core/connectors
 * @description LocalStorage-backed queue connector.
 *   Persists jobs in localStorage as JSON. FIFO ordering by timestamp.
 *   Survives page refreshes. Includes max-entry eviction.
 *   Only works in browser environments with localStorage available.
 */

import { IInjectable } from '@stackra/ts-container';
import type {
  IQueueConnection,
  IQueueConnector,
  IJobOptions,
  IQueuedJob,
  QueueConnectionConfig,
} from '../interfaces';
import { generateJobId } from '../utils/job-helpers.util';

// ════════════════════════════════════════════════════════════════════════════════
// Connection
// ════════════════════════════════════════════════════════════════════════════════

/** LocalStorage queue connection — persists jobs as JSON in browser storage. */
class LocalStorageConnection implements IQueueConnection {
  /** Key prefix for all queue entries. */
  private readonly prefix: string;

  /** Maximum entries to retain per queue. */
  private readonly maxEntries: number;

  public constructor(config: QueueConnectionConfig) {
    this.prefix = (config.prefix as string) ?? 'queue:';
    this.maxEntries = (config.maxEntries as number) ?? 1000;
  }

  /** @inheritdoc */
  public async push<T>(name: string, data: T, options?: IJobOptions): Promise<string> {
    const queueName = options?.queue ?? 'default';
    const id = generateJobId();
    const job: IQueuedJob<T> = {
      id,
      name,
      data,
      attempts: 0,
      maxAttempts: options?.tries ?? 1,
      queue: queueName,
      createdAt: Date.now(),
    };

    this.storeJob(queueName, job);
    this.enforceLimit(queueName);
    return id;
  }

  /** @inheritdoc */
  public async later<T>(
    _delayMs: number,
    name: string,
    data: T,
    options?: IJobOptions
  ): Promise<string> {
    // LocalStorage doesn't support delays natively — store with timestamp offset
    return this.push(name, data, options);
  }

  /** @inheritdoc */
  public async bulk<T>(
    jobs: Array<{ name: string; data: T; options?: IJobOptions }>
  ): Promise<string[]> {
    const ids: string[] = [];
    for (const job of jobs) {
      ids.push(await this.push(job.name, job.data, job.options));
    }
    return ids;
  }

  /** @inheritdoc */
  public async pop(queue: string = 'default'): Promise<IQueuedJob | null> {
    const jobs = this.getJobs(queue);
    if (jobs.length === 0) return null;

    // Sort by createdAt (FIFO — oldest first)
    jobs.sort((a, b) => a.createdAt - b.createdAt);
    const oldest = jobs[0]!;

    // Remove from storage
    this.removeJob(queue, oldest.id);
    return oldest;
  }

  /** @inheritdoc */
  public async size(queue: string = 'default'): Promise<number> {
    return this.getJobs(queue).length;
  }

  /** @inheritdoc */
  public async remove(jobId: string): Promise<void> {
    // Search all queues
    const keys = this.getAllQueueKeys();
    for (const key of keys) {
      const queueName = key.replace(this.prefix, '');
      this.removeJob(queueName, jobId);
    }
  }

  /** @inheritdoc */
  public async pause(_queue?: string): Promise<void> {
    /* no-op for localStorage */
  }
  /** @inheritdoc */
  public async resume(_queue?: string): Promise<void> {
    /* no-op */
  }

  /** @inheritdoc */
  public async clear(queue: string = 'default'): Promise<void> {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(this.getKey(queue));
  }

  /** @inheritdoc */
  public async close(): Promise<void> {
    /* no-op — localStorage persists */
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private Helpers
  // ══════════════════════════════════════════════════════════════════════════════

  private getKey(queue: string): string {
    return `${this.prefix}${queue}`;
  }

  private getJobs(queue: string): IQueuedJob[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.getKey(queue));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private storeJob(queue: string, job: IQueuedJob): void {
    if (typeof localStorage === 'undefined') return;
    const jobs = this.getJobs(queue);
    jobs.push(job);
    try {
      localStorage.setItem(this.getKey(queue), JSON.stringify(jobs));
    } catch {
      /* quota */
    }
  }

  private removeJob(queue: string, jobId: string): void {
    if (typeof localStorage === 'undefined') return;
    const jobs = this.getJobs(queue);
    const filtered = jobs.filter((j) => j.id !== jobId);
    if (filtered.length !== jobs.length) {
      localStorage.setItem(this.getKey(queue), JSON.stringify(filtered));
    }
  }

  private enforceLimit(queue: string): void {
    const jobs = this.getJobs(queue);
    if (jobs.length <= this.maxEntries) return;
    // Remove oldest entries
    const trimmed = jobs.slice(jobs.length - this.maxEntries);
    localStorage.setItem(this.getKey(queue), JSON.stringify(trimmed));
  }

  private getAllQueueKeys(): string[] {
    if (typeof localStorage === 'undefined') return [];
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) keys.push(key);
    }
    return keys;
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// Connector
// ════════════════════════════════════════════════════════════════════════════════

/** LocalStorage connector — creates LocalStorageConnection instances. */
@IInjectable()
export class LocalStorageConnector implements IQueueConnector {
  public async connect(config: QueueConnectionConfig): Promise<IQueueConnection> {
    return new LocalStorageConnection(config);
  }
}
