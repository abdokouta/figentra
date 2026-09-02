import type { QueueHandler, QueueMessage, QueueProvider, QueueProviderCapabilities, QueuePublishOptions, QueuePublishResult } from '../contracts/queue.types';

export interface CloudflareQueueBinding<TMessage = unknown> {
  send(body: TMessage, options?: { delaySeconds?: number }): Promise<void>;
  sendBatch?(messages: readonly { body: TMessage; options?: { delaySeconds?: number } }[]): Promise<void>;
}

export interface CloudflareQueueBatchMessage<TBody = unknown> {
  body: TBody;
  id: string;
  attempts: number;
  timestamp: Date;
  ack(): void;
  retry(options?: { delaySeconds?: number }): void;
}

/** Producer adapter for the Worker Queue binding. */
export class CloudflareQueueProvider implements QueueProvider {
  readonly kind = 'cloudflare' as const;
  readonly capabilities: QueueProviderCapabilities = {
    delayedDelivery: true,
    deduplication: false,
    fifo: false,
    batching: true,
    deadLetter: true,
    consumer: false,
    visibilityTimeout: false,
  };

  constructor(private readonly queue: CloudflareQueueBinding) { }

  async publish<TBody>(queue: string, message: QueueMessage<TBody>, options: QueuePublishOptions = {}): Promise<QueuePublishResult> {
    if (!queue.trim()) throw new Error('Queue name cannot be empty.');
    await this.queue.send(message, { delaySeconds: options.delayMs ? Math.ceil(options.delayMs / 1000) : undefined });
    return { id: message.id, provider: this.kind };
  }

  async publishBatch<TBody>(queue: string, messages: readonly QueueMessage<TBody>[], options: QueuePublishOptions = {}): Promise<{ id: string; provider: 'cloudflare'; count: number }> {
    if (!queue.trim()) throw new Error('Queue name cannot be empty.');
    if (!this.queue.sendBatch) {
      for (const message of messages) await this.publish(queue, message, options);
    } else {
      await this.queue.sendBatch(messages.map((body) => ({ body, options: { delaySeconds: options.delayMs ? Math.ceil(options.delayMs / 1000) : undefined } })));
    }
    return { id: messages[0]?.id ?? crypto.randomUUID(), provider: this.kind, count: messages.length };
  }

  /** Adapt a platform-delivered queue batch to the framework handler contract. */
  async handleBatch<TBody>(messages: readonly CloudflareQueueBatchMessage<TBody>[], handler: QueueHandler<TBody>): Promise<void> {
    for (const message of messages) {
      await handler({
        message: { id: message.id, type: 'cloudflare.queue', body: message.body, attempt: message.attempts, availableAt: message.timestamp.toISOString() },
        ack: () => message.ack(),
        retry: (options) => message.retry(options?.delayMs ? { delaySeconds: Math.ceil(options.delayMs / 1000) } : undefined),
      });
    }
  }
}
