import type { QueueConsumeOptions, QueueHandler, QueueMessage, QueueProvider, QueueProviderCapabilities, QueuePublishOptions, QueuePublishResult, QueueSubscription } from '../contracts/queue.types.js';

export interface RedisQueueClient {
  lpush(key: string, value: string): Promise<number>;
  brpop?(key: string, timeoutSeconds: number): Promise<[string, string] | null>;
  rpush?(key: string, value: string): Promise<number>;
}

/** Minimal Redis list adapter. Use Redis Streams when consumer groups/leases are required. */
export class RedisQueueProvider implements QueueProvider {
  readonly kind = 'redis' as const;
  readonly capabilities: QueueProviderCapabilities = {
    delayedDelivery: false,
    deduplication: false,
    fifo: false,
    batching: true,
    deadLetter: false,
    consumer: true,
    visibilityTimeout: false,
  };

  constructor(private readonly redis: RedisQueueClient, private readonly key: (queue: string) => string = (queue) => `queue:${queue}`) {}

  async publish<TBody>(queue: string, message: QueueMessage<TBody>, _options: QueuePublishOptions = {}): Promise<QueuePublishResult> {
    await this.redis.lpush(this.key(queue), JSON.stringify(message));
    return { id: message.id, provider: this.kind };
  }

  async consume<TBody>(queue: string, handler: QueueHandler<TBody>): Promise<QueueSubscription> {
    if (!this.redis.brpop) throw new Error('Configured Redis client does not support BRPOP.');
    let closed = false;
    const loop = async () => {
      while (!closed) {
        const result = await this.redis.brpop!(this.key(queue), 1);
        if (!result) continue;
        const message = JSON.parse(result[1]) as QueueMessage<TBody>;
        let retryRequested = false;
        await handler({
          message,
          ack: () => undefined,
          retry: async () => {
            retryRequested = true;
            if (this.redis.rpush) await this.redis.rpush!(this.key(queue), JSON.stringify(message));
          },
        });
        if (retryRequested) continue;
      }
    };
    void loop();
    return { close: () => { closed = true; } };
  }
}
