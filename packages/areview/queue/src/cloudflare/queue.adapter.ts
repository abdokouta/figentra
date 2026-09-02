import type { QueueMessage, QueueProvider, QueuePublishOptions, QueuePublishResult, QueueProviderCapabilities } from '../contracts/queue.types.js';
export interface CloudflareQueueBinding<TMessage = unknown> { send(body: TMessage, options?: { delaySeconds?: number }): Promise<void>; }
export class CloudflareQueueProvider implements QueueProvider {
  readonly kind='cloudflare' as const;
  readonly capabilities: QueueProviderCapabilities={delayedDelivery:true,batching:true,deadLetter:true,consumer:true};
  constructor(private readonly queue: CloudflareQueueBinding) {}
  async publish<TBody>(queue: string, message: QueueMessage<TBody>, options: QueuePublishOptions={}): Promise<QueuePublishResult> { if(queue.trim()==='') throw new Error('Queue name cannot be empty.'); await this.queue.send(message,{delaySeconds: options.delayMs ? Math.ceil(options.delayMs/1000) : undefined}); return {id:message.id,provider:this.kind}; }
}
