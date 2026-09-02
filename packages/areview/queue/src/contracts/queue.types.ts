/** Provider-neutral asynchronous queue contracts. */
export type QueueProviderKind = 'cloudflare' | 'sqs' | 'redis' | 'bullmq' | 'custom';
export type QueueDeliveryMode = 'at-least-once' | 'best-effort';

export interface QueueMessage<TBody = unknown> {
  id: string;
  type: string;
  body: TBody;
  attempt?: number;
  availableAt?: string;
  headers?: Record<string, string>;
}

export interface QueuePublishOptions {
  messageId?: string;
  delayMs?: number;
  headers?: Record<string, string>;
  deduplicationId?: string;
  groupId?: string;
}

export interface QueuePublishResult {
  id: string;
  provider: QueueProviderKind;
}

export interface QueueBatchPublishResult extends QueuePublishResult {
  count: number;
}

export interface QueueProviderCapabilities {
  delayedDelivery: boolean;
  deduplication: boolean;
  fifo: boolean;
  batching: boolean;
  deadLetter: boolean;
  consumer: boolean;
  visibilityTimeout: boolean;
  maxMessageSize?: number;
}

export interface QueueConsumerContext<TBody = unknown> {
  readonly message: QueueMessage<TBody>;
  ack(): Promise<void> | void;
  retry(options?: { delayMs?: number }): Promise<void> | void;
  deadLetter?(reason?: string): Promise<void> | void;
}

export type QueueHandler<TBody = unknown> = (context: QueueConsumerContext<TBody>) => Promise<void> | void;

export interface QueueConsumeOptions {
  concurrency?: number;
  visibilityTimeoutMs?: number;
  batchSize?: number;
}

export interface QueueSubscription {
  close(): Promise<void> | void;
}

/**
 * Provider contract. Providers may be producer-only; consumers are optional
 * because some platforms (for example Cloudflare Queues) invoke consumers
 * through the platform Worker entrypoint instead of a pull API.
 */
export interface QueueProvider {
  readonly kind: QueueProviderKind;
  readonly capabilities: QueueProviderCapabilities;
  publish<TBody>(queue: string, message: QueueMessage<TBody>, options?: QueuePublishOptions): Promise<QueuePublishResult>;
  publishBatch?<TBody>(queue: string, messages: readonly QueueMessage<TBody>[], options?: QueuePublishOptions): Promise<QueueBatchPublishResult>;
  consume?<TBody>(queue: string, handler: QueueHandler<TBody>, options?: QueueConsumeOptions): Promise<QueueSubscription>;
  close?(): Promise<void>;
}

export interface QueueManagerOptions {
  providers: Record<string, QueueProvider>;
  defaultProvider: string;
}

export class QueueManager {
  constructor(private readonly options: QueueManagerOptions) {
    if (!options.defaultProvider.trim()) throw new Error('Default queue provider cannot be empty.');
  }

  hasProvider(name: string): boolean { return Boolean(this.options.providers[name]); }

  provider(name?: string): QueueProvider {
    const key = name ?? this.options.defaultProvider;
    const provider = this.options.providers[key];
    if (!provider) throw new Error(`Queue provider not configured: ${key}`);
    return provider;
  }

  async publish<TBody>(queue: string, type: string, body: TBody, options: QueuePublishOptions & { provider?: string } = {}): Promise<QueuePublishResult> {
    const { provider: providerName, ...publishOptions } = options;
    const id = publishOptions.messageId ?? crypto.randomUUID();
    return this.provider(providerName).publish(queue, { id, type, body, headers: publishOptions.headers }, publishOptions);
  }

  async publishBatch<TBody>(queue: string, messages: readonly QueueMessage<TBody>[], options: QueuePublishOptions & { provider?: string } = {}): Promise<QueueBatchPublishResult> {
    const provider = this.provider(options.provider);
    if (provider.publishBatch) return provider.publishBatch(queue, messages, options);
    const results = await Promise.all(messages.map((message) => provider.publish(queue, message, options)));
    return { id: results[0]?.id ?? crypto.randomUUID(), provider: provider.kind, count: results.length };
  }

  consume<TBody>(queue: string, handler: QueueHandler<TBody>, options: QueueConsumeOptions & { provider?: string } = {}): Promise<QueueSubscription> {
    const provider = this.provider(options.provider);
    if (!provider.consume) throw new Error(`Queue provider ${provider.kind} does not expose a pull consumer. Use its native consumer entrypoint.`);
    return provider.consume(queue, handler, options);
  }

  dispatch<TBody>(type: string, body: TBody, options: QueuePublishOptions & { queue?: string; provider?: string } = {}): Promise<string> {
    return this.publish(options.queue ?? 'default', type, body, options).then((result) => result.id);
  }
}
