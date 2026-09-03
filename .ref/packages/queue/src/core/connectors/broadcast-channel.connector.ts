/**
 * @file broadcast-channel.connector.ts
 * @module @stackra/queue/core/connectors
 * @description BroadcastChannel-backed queue connector.
 *   Distributes jobs across browser tabs. Uses @stackra/coordinator
 *   leader election — only the leader tab acts as the worker.
 *   Other tabs dispatch jobs via the channel; the leader processes them.
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

/** BroadcastChannel connection — cross-tab job distribution. */
class BroadcastChannelConnection implements IQueueConnection {
  /** BroadcastChannel for cross-tab messaging. */
  private channel: BroadcastChannel | null = null;

  /** Local job queue (only the leader processes these). */
  private readonly localQueue: IQueuedJob[] = [];

  /** Channel name. */
  private readonly channelName: string;

  public constructor(config: QueueConnectionConfig) {
    this.channelName = (config.channelName as string) ?? 'stackra-queue';

    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(this.channelName);
      this.channel.onmessage = (event: MessageEvent) => {
        const msg = event.data;
        if (msg && msg.kind === 'job') {
          this.localQueue.push(msg.job);
        }
      };
    }
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

    // Broadcast to all tabs (including self)
    if (this.channel) {
      this.channel.postMessage({ kind: 'job', job });
    }

    // Also store locally (in case we're the leader)
    this.localQueue.push(job);
    return id;
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
    const index = this.localQueue.findIndex((j) => j.queue === queue);
    if (index === -1) return null;
    return this.localQueue.splice(index, 1)[0] ?? null;
  }

  /** @inheritdoc */
  public async size(queue: string = 'default'): Promise<number> {
    return this.localQueue.filter((j) => j.queue === queue).length;
  }

  /** @inheritdoc */
  public async remove(jobId: string): Promise<void> {
    const index = this.localQueue.findIndex((j) => j.id === jobId);
    if (index !== -1) this.localQueue.splice(index, 1);
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
    for (let i = this.localQueue.length - 1; i >= 0; i--) {
      if (this.localQueue[i]!.queue === queue) this.localQueue.splice(i, 1);
    }
  }

  /** @inheritdoc */
  public async close(): Promise<void> {
    this.channel?.close();
    this.channel = null;
    this.localQueue.length = 0;
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// Connector
// ════════════════════════════════════════════════════════════════════════════════

/** BroadcastChannel connector — cross-tab job distribution. */
@IInjectable()
export class BroadcastChannelConnector implements IQueueConnector {
  public async connect(config: QueueConnectionConfig): Promise<IQueueConnection> {
    return new BroadcastChannelConnection(config);
  }
}
