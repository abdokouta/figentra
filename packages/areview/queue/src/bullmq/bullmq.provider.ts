import type { QueueConsumeOptions, QueueHandler, QueueMessage, QueueProvider, QueueProviderCapabilities, QueuePublishOptions, QueuePublishResult, QueueSubscription } from '../contracts/queue.types';

export interface BullMqQueueLike {
  add(name: string, data: unknown, options?: Record<string, unknown>): Promise<{ id?: string | number }>;
  close?(): Promise<void>;
}

export interface BullMqWorkerLike { close(): Promise<void>; }

export interface BullMqFactory {
  queue(name: string): BullMqQueueLike;
  worker(name: string, handler: (job: { id?: string | number; name: string; data: unknown; attemptsMade?: number }) => Promise<void>, options?: QueueConsumeOptions): BullMqWorkerLike;
}

export class BullMqQueueProvider implements QueueProvider {
  readonly kind = 'bullmq' as const;
  readonly capabilities: QueueProviderCapabilities = {
    delayedDelivery: true,
    deduplication: false,
    fifo: false,
    batching: true,
    deadLetter: false,
    consumer: true,
    visibilityTimeout: true,
  };

  constructor(private readonly factory: BullMqFactory) { }

  async publish<TBody>(queue: string, message: QueueMessage<TBody>, options: QueuePublishOptions = {}): Promise<QueuePublishResult> {
    const job = await this.factory.queue(queue).add(message.type, message, {
      jobId: options.messageId ?? message.id,
      delay: options.delayMs,
    });
    return { id: String(job.id ?? message.id), provider: this.kind };
  }

  async consume<TBody>(queue: string, handler: QueueHandler<TBody>, options: QueueConsumeOptions = {}): Promise<QueueSubscription> {
    const worker = this.factory.worker(queue, async (job) => {
      let retryRequested = false;
      await handler({
        message: { id: String(job.id ?? crypto.randomUUID()), type: job.name, body: job.data as TBody, attempt: job.attemptsMade },
        ack: () => undefined,
        retry: () => { retryRequested = true; },
      });
      if (retryRequested) throw new Error('Queue handler requested retry.');
    }, options);
    return { close: () => worker.close() };
  }
}
