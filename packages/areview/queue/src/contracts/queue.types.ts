export type QueueProviderKind = 'cloudflare' | 'sqs' | 'redis' | 'bullmq' | 'custom';

export interface QueueMessage<TBody = unknown> { id: string; type: string; body: TBody; attempt?: number; availableAt?: string; headers?: Record<string, string>; }
export interface QueuePublishOptions { messageId?: string; delayMs?: number; headers?: Record<string, string>; deduplicationId?: string; groupId?: string; }
export interface QueuePublishResult { id: string; provider: QueueProviderKind; }
export interface QueueProviderCapabilities { delayedDelivery?: boolean; deduplication?: boolean; fifo?: boolean; batching?: boolean; deadLetter?: boolean; consumer?: boolean; }
export interface QueueProvider { readonly kind: QueueProviderKind; readonly capabilities: QueueProviderCapabilities; publish<TBody>(queue: string, message: QueueMessage<TBody>, options?: QueuePublishOptions): Promise<QueuePublishResult>; }
export interface QueueConsumerContext<TBody = unknown> { message: QueueMessage<TBody>; ack(): Promise<void> | void; retry(delayMs?: number): Promise<void> | void; deadLetter?(reason?: string): Promise<void> | void; }
export type QueueHandler<TBody = unknown> = (context: QueueConsumerContext<TBody>) => Promise<void> | void;

/** Named provider registry used by applications and Nest modules. */
export class QueueManager {
  constructor(private readonly providers: Record<string, QueueProvider>, private readonly defaultProvider: string) {}
  provider(name?: string): QueueProvider { const provider = this.providers[name ?? this.defaultProvider]; if (!provider) throw new Error(`Queue provider not configured: ${name ?? this.defaultProvider}`); return provider; }
  publish<TBody>(queue: string, type: string, body: TBody, options?: QueuePublishOptions & { provider?: string }): Promise<QueuePublishResult> { const { provider: providerName, ...publishOptions } = options ?? {}; const messageId = publishOptions.messageId ?? crypto.randomUUID(); return this.provider(providerName).publish(queue, { id: messageId, type, body, headers: publishOptions.headers }, publishOptions); }
  dispatch<TBody>(type: string, body: TBody, options: QueuePublishOptions & { queue?: string; provider?: string } = {}): Promise<string> { return this.publish(options.queue ?? 'default', type, body, options).then((result) => result.id); }
}
