import type { QueueMessage, QueueProvider, QueuePublishOptions, QueuePublishResult, QueueProviderCapabilities } from '../contracts/queue.types.js';
export interface RedisQueueClient { lpush(key:string,value:string):Promise<number>; }
export class RedisQueueProvider implements QueueProvider {
  readonly kind='redis' as const;
  readonly capabilities:QueueProviderCapabilities={batching:true,consumer:true};
  constructor(private readonly redis:RedisQueueClient, private readonly key:(queue:string)=>string=(queue)=>`queue:${queue}`) {}
  async publish<TBody>(queue:string,message:QueueMessage<TBody>,_options:QueuePublishOptions={}):Promise<QueuePublishResult>{ await this.redis.lpush(this.key(queue),JSON.stringify(message)); return {id:message.id,provider:this.kind}; }
}
