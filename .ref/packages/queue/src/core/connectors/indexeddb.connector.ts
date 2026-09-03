/**
 * @file indexeddb.connector.ts
 * @module @stackra/queue/core/connectors
 * @description IndexedDB-backed queue connector for offline-first scenarios.
 *   Stores jobs in IndexedDB with objectStore indexes for efficient pop.
 *   Handles large payloads better than localStorage (no 5MB limit).
 *   Works in browsers and service workers.
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

/** IndexedDB queue connection. */
class IndexedDBConnection implements IQueueConnection {
  /** Database name. */
  private readonly dbName: string;

  /** Store name for jobs. */
  private readonly storeName = 'jobs';

  /** Open database instance. */
  private db: IDBDatabase | null = null;

  public constructor(config: QueueConnectionConfig) {
    this.dbName = (config.dbName as string) ?? 'stackra-queue';
  }

  /** Open the IndexedDB database. */
  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('queue_created', ['queue', 'createdAt'], { unique: false });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /** @inheritdoc */
  public async push<T>(name: string, data: T, options?: IJobOptions): Promise<string> {
    const db = await this.getDB();
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

    return new Promise<string>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      tx.objectStore(this.storeName).add(job);
      tx.oncomplete = () => resolve(id);
      tx.onerror = () => reject(tx.error);
    });
  }

  /** @inheritdoc */
  public async later<T>(
    _delayMs: number,
    name: string,
    data: T,
    options?: IJobOptions
  ): Promise<string> {
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
    const db = await this.getDB();

    return new Promise<IQueuedJob | null>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const index = store.index('queue_created');
      const range = IDBKeyRange.bound([queue, 0], [queue, Infinity]);
      const request = index.openCursor(range);

      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          resolve(null);
          return;
        }
        const job = cursor.value as IQueuedJob;
        cursor.delete();
        resolve(job);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /** @inheritdoc */
  public async size(queue: string = 'default'): Promise<number> {
    const db = await this.getDB();

    return new Promise<number>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const index = store.index('queue_created');
      const range = IDBKeyRange.bound([queue, 0], [queue, Infinity]);
      const request = index.count(range);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /** @inheritdoc */
  public async remove(jobId: string): Promise<void> {
    const db = await this.getDB();

    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      tx.objectStore(this.storeName).delete(jobId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /** @inheritdoc */
  public async pause(_queue?: string): Promise<void> {
    /* no-op */
  }
  /** @inheritdoc */
  public async resume(_queue?: string): Promise<void> {
    /* no-op */
  }

  /** @inheritdoc */
  public async clear(queue: string = 'default'): Promise<void> {
    const db = await this.getDB();

    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const index = store.index('queue_created');
      const range = IDBKeyRange.bound([queue, 0], [queue, Infinity]);
      const request = index.openCursor(range);

      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          resolve();
          return;
        }
        cursor.delete();
        cursor.continue();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /** @inheritdoc */
  public async close(): Promise<void> {
    this.db?.close();
    this.db = null;
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// Connector
// ════════════════════════════════════════════════════════════════════════════════

/** IndexedDB connector — creates IndexedDBConnection instances. */
@IInjectable()
export class IndexedDBConnector implements IQueueConnector {
  public async connect(config: QueueConnectionConfig): Promise<IQueueConnection> {
    return new IndexedDBConnection(config);
  }
}
